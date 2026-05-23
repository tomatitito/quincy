const functionNodeTypes = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

const normalizePath = (path) => path.replaceAll("\\", "/");

const globPatternToRegExp = (pattern) => {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*");
  return new RegExp(escaped);
};

const matchesAnyPattern = (value, patterns = []) => {
  return patterns.some((pattern) => globPatternToRegExp(pattern).test(value));
};

const getReturnTypeAnnotation = (node) => node.returnType?.typeAnnotation ?? null;

const isVoidType = (node) => node?.type === "TSVoidKeyword";

const isPromiseVoidType = (node) => {
  if (node?.type !== "TSTypeReference") return false;
  if (node.typeName?.type !== "Identifier" || node.typeName.name !== "Promise") return false;

  const firstParameter = node.typeParameters?.params?.[0] ?? node.typeArguments?.params?.[0];
  return isVoidType(firstParameter);
};

const isVoidReturnType = (node) => {
  const returnType = getReturnTypeAnnotation(node);
  return isVoidType(returnType) || isPromiseVoidType(returnType);
};

const getFunctionName = (node) => {
  if (node.id?.type === "Identifier") return node.id.name;

  const parent = node.parent;
  if (parent?.type === "VariableDeclarator" && parent.id?.type === "Identifier") {
    return parent.id.name;
  }
  if (parent?.type === "Property" || parent?.type === "MethodDefinition") {
    if (parent.key?.type === "Identifier") return parent.key.name;
    if (parent.key?.type === "Literal") return String(parent.key.value);
  }

  return null;
};

const isAllowedFunction = (node, options) => {
  const name = getFunctionName(node);
  if (!name) return false;

  return (
    options.allowFunctionNames?.includes(name) ||
    matchesAnyPattern(name, options.allowFunctionNamePatterns)
  );
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow explicit void function return types.",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          allowFiles: {
            type: "array",
            items: { type: "string" },
          },
          allowFunctionNames: {
            type: "array",
            items: { type: "string" },
          },
          allowFunctionNamePatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      voidReturn:
        "We are aiming for a functional style that features referential transparency " +
        "and code that is easy to reason about. Functions that return void are usually " +
        "a sign of side effects and should be avoided if possible. Make a judgement " +
        "call about this. Function '{{name}}' has an explicit void or Promise<void> " +
        "return type. If this is intentional, suppress this rule with " +
        "// eslint-disable-next-line sensors/no-void-return-functions",
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const filename = normalizePath(context.filename ?? context.getFilename?.() ?? "");

    if (matchesAnyPattern(filename, options.allowFiles)) {
      return {};
    }

    const checkFunction = (node) => {
      if (!isVoidReturnType(node) || isAllowedFunction(node, options)) {
        return;
      }

      context.report({
        node,
        messageId: "voidReturn",
        data: { name: getFunctionName(node) ?? "<anonymous>" },
      });
    };

    return {
      ":function"(node) {
        if (functionNodeTypes.has(node.type)) {
          checkFunction(node);
        }
      },
    };
  },
};

export default rule;
