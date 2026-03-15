import type { PrismaClient } from "@prisma/client";

import { dataRpc, isDataServiceConfigured } from "@/lib/dataClient";

const OP_SYMBOL = Symbol("remotePrismaOperation");

const READ_MODEL_METHODS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "findFirstOrThrow",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const READ_ROOT_METHODS = new Set(["$queryRaw", "$queryRawUnsafe"]);

function isReadOperation(descriptor: RemoteOperationDescriptor) {
  if (descriptor.type === "root") {
    return READ_ROOT_METHODS.has(descriptor.method);
  }
  return READ_MODEL_METHODS.has(descriptor.method);
}

function getFallbackResult(descriptor: RemoteOperationDescriptor) {
  if (descriptor.type === "root") {
    return [];
  }

  switch (descriptor.method) {
    case "findMany":
    case "groupBy":
      return [];
    case "findFirst":
    case "findUnique":
    case "findFirstOrThrow":
    case "findUniqueOrThrow":
      return null;
    case "count":
      return 0;
    case "aggregate":
      return {};
    default:
      return null;
  }
}

type RemoteOperationDescriptor = {
  type: "model" | "root";
  model?: string;
  method: string;
  args?: unknown[];
};

type RemoteTransactionDescriptor = {
  type: "transaction";
  operations: RemoteOperationDescriptor[];
};

type RemoteOperation = {
  [OP_SYMBOL]: RemoteOperationDescriptor;
  then: <TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: unknown) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) => Promise<TResult1 | TResult2>;
  catch: <TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => Promise<TResult>;
  finally: (onfinally?: (() => void) | null) => Promise<unknown>;
};

function isSqlFragment(value: unknown) {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { values?: unknown[] }).values) &&
    Array.isArray((value as { strings?: string[] }).strings)
  );
}

function serializeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }
  if (isSqlFragment(value)) {
    const fragment = value as { strings: string[]; values: unknown[] };
    return {
      strings: fragment.strings,
      values: fragment.values.map((item) => serializeValue(item)),
    };
  }
  return value;
}

function serializeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => serializeValue(arg));
}

function normalizeRawArgs(args: unknown[]): unknown[] {
  const [first, ...rest] = args;
  if (Array.isArray(first) && first.every((entry) => typeof entry === "string")) {
    return [{ strings: first as string[], values: rest.map(serializeValue) }];
  }
  return serializeArgs(args);
}

function createRemoteOperation(
  descriptor: RemoteOperationDescriptor
): RemoteOperation {
  let promise: Promise<unknown> | null = null;
  const isConfigured = isDataServiceConfigured();

  const getPromise = () => {
    if (!promise) {
      if (!isConfigured) {
        promise = Promise.resolve(getFallbackResult(descriptor));
      } else {
        promise = dataRpc(descriptor);
      }
    }
    return promise;
  };

  const wrapped = {
    [OP_SYMBOL]: descriptor,
    then(onfulfilled: any, onrejected: any) {
      return getPromise().then(onfulfilled, onrejected);
    },
    catch(onrejected: any) {
      return getPromise().catch(onrejected);
    },
    finally(onfinally: any) {
      return getPromise().finally(onfinally);
    },
  } as RemoteOperation;

  return wrapped;
}

function getOperationDescriptor(value: unknown): RemoteOperationDescriptor {
  if (value && typeof value === "object" && (value as any)[OP_SYMBOL]) {
    return (value as RemoteOperation)[OP_SYMBOL];
  }
  throw new Error("INVALID_TRANSACTION_OPERATION");
}

function createModelProxy(model: string) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const method = String(prop);
        return (...args: unknown[]) =>
          createRemoteOperation({
            type: "model",
            model,
            method,
            args: serializeArgs(args),
          });
      },
    }
  );
}

const prismaProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      const method = String(prop);

      if (
        method === "$queryRaw" ||
        method === "$executeRaw" ||
        method === "$queryRawUnsafe" ||
        method === "$executeRawUnsafe"
      ) {
        return (...args: unknown[]) =>
          createRemoteOperation({
            type: "root",
            method,
            args: normalizeRawArgs(args),
          });
      }

      if (method === "$transaction") {
        return (operations: unknown[]) => {
          if (!Array.isArray(operations) || operations.length === 0) {
            throw new Error("INVALID_TRANSACTION_PAYLOAD");
          }
          const ops = operations.map((op) => getOperationDescriptor(op));
          if (!isDataServiceConfigured()) {
            return Promise.resolve(ops.map((op) => getFallbackResult(op)));
          }
          const payload: RemoteTransactionDescriptor = {
            type: "transaction",
            operations: ops,
          };
          return dataRpc(payload);
        };
      }

      if (method === "$connect" || method === "$disconnect" || method === "$use") {
        return async () => undefined;
      }

      return createModelProxy(method);
    },
  }
);

export const prisma = prismaProxy as PrismaClient;

export default prisma;
