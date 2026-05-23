const DOMAIN_PATH_PART = "/src/lib/domain/";

const primitiveTypeNames = new Map([
  ["TSStringKeyword", "string"],
  ["TSNumberKeyword", "number"],
  ["TSBooleanKeyword", "boolean"],
  ["TSBigIntKeyword", "bigint"],
  ["TSSymbolKeyword", "symbol"],
  ["TSNullKeyword", "null"],
  ["TSUndefinedKeyword", "undefined"],
]);

const normalizePath = (path) => path.replaceAll("\\", "/");
const isInDomainModule = (filename) => normalizePath(filename).includes(DOMAIN_PATH_PART);
const isPrimitiveAliasDefinition = (node) => {
  let current = node.parent;
  while (current) {
    if (current.type === "TSTypeAliasDeclaration") return true;
    current = current.parent;
  }
  return false;
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow raw primitive type annotations in the domain module.",
    },
    schema: [],
    messages: {
      primitiveType:
        "We want to convey semantic meaning through types. Therefore domain types " + 
        "should use semantic type aliases instead of raw primitive '{{typeName}}'. " +
        "If you decide not to create a named alias in the domain module and reference " +
        "that alias here, diable this rule with:" + 
        "// eslint-disable-next-line sensors/no-domain-primitives\n",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    if (!isInDomainModule(filename)) return {};

    const checkPrimitive = (node) => {
      if (isPrimitiveAliasDefinition(node)) return;
      context.report({ node, messageId: "primitiveType", data: { typeName: primitiveTypeNames.get(node.type) } });
    };

    return Object.fromEntries([...primitiveTypeNames.keys()].map((nodeType) => [nodeType, checkPrimitive]));
  },
};

export default rule;
