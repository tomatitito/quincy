const MUTATING_METHODS = new Set([
  "copyWithin",
  "delete",
  "fill",
  "pop",
  "push",
  "reverse",
  "set",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

const getStaticPropertyName = (node) => {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return null;
};

const getBaseIdentifierName = (node) => {
  let current = node;
  while (current?.type === "ChainExpression") {
    current = current.expression;
  }
  while (current?.type === "MemberExpression") {
    current = current.object;
    while (current?.type === "ChainExpression") {
      current = current.expression;
    }
  }
  return current?.type === "Identifier" ? current.name : null;
};

const getSimpleParamNames = (params) =>
  new Set(params.filter((param) => param.type === "Identifier").map((param) => param.name));

const isFunctionNode = (node) =>
  node.type === "FunctionDeclaration" ||
  node.type === "FunctionExpression" ||
  node.type === "ArrowFunctionExpression";

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require mutated function parameters to be returned.",
    },
    schema: [],
    messages: {
      mutatedParamNotReturned:
        "We are aiming for a functional style with referential transparency that is " +
        "easy to reason about and to test. Therefore, when we do use mutation, we require " +
        "mutated function parameters to be returned by that function. Parameter '{{name}}' " +
        "is mutated but not returned from this function.",
    },
  },

  create(context) {
    const stack = [];

    const currentFrame = () => stack.at(-1);

    const noteMutation = (name) => {
      const frame = currentFrame();
      if (frame?.paramNames.has(name)) {
        frame.mutatedParams.add(name);
      }
    };

    return {
      ":function"(node) {
        stack.push({
          node,
          paramNames: getSimpleParamNames(node.params),
          mutatedParams: new Set(),
          returnedParams: new Set(),
        });
      },

      AssignmentExpression(node) {
        if (node.left.type === "MemberExpression") {
          const baseName = getBaseIdentifierName(node.left);
          if (baseName) noteMutation(baseName);
        }
      },

      UpdateExpression(node) {
        if (node.argument.type === "MemberExpression") {
          const baseName = getBaseIdentifierName(node.argument);
          if (baseName) noteMutation(baseName);
        }
      },

      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") return;

        const methodName = getStaticPropertyName(node.callee.property);
        if (!MUTATING_METHODS.has(methodName)) return;

        const baseName = getBaseIdentifierName(node.callee.object);
        if (baseName) noteMutation(baseName);
      },

      ReturnStatement(node) {
        const frame = currentFrame();
        if (!frame) return;

        const argument = node.argument;
        if (argument?.type === "Identifier" && frame.paramNames.has(argument.name)) {
          frame.returnedParams.add(argument.name);
        }
      },

      ":function:exit"() {
        const frame = stack.pop();
        for (const name of frame.mutatedParams) {
          if (!frame.returnedParams.has(name)) {
            context.report({
              node: frame.node,
              messageId: "mutatedParamNotReturned",
              data: { name },
            });
          }
        }
      },
    };
  },
};

export default rule;
