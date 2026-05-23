const DEFAULT_MAX_LINES = 10;

const functionNodeTypes = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

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

  return "<anonymous>";
};

const getFunctionLineCount = (node) => {
  if (!node.loc) return 0;
  return node.loc.end.line - node.loc.start.line + 1;
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit function length.",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          max: {
            type: "integer",
            minimum: 1,
          },
        },
      },
    ],
    messages: {
      tooManyLines:
        "We are aiming for code that is focused and easy to reason about. Long functions " +
        "usually do too many things and hide the important decisions. Function '{{name}}' " +
        "has {{lineCount}} lines, which is more than the allowed {{max}} lines. Extract " +
        "small named functions so each step has one clear purpose. Make a judgement call " +
        "about this. If you decide to keep this function this long, suppress this rule with " +
        "// eslint-disable-next-line sensors/max-function-lines",
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const max = options.max ?? DEFAULT_MAX_LINES;

    const checkFunction = (node) => {
      const lineCount = getFunctionLineCount(node);
      if (lineCount <= max) return;

      context.report({
        node,
        messageId: "tooManyLines",
        data: {
          name: getFunctionName(node),
          lineCount,
          max,
        },
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
