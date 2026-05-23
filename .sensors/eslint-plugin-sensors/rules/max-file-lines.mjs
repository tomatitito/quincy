const DEFAULT_MAX_LINES = 200;

const getSourceCode = (context) => context.sourceCode ?? context.getSourceCode();

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit file length.",
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
        "We are aiming for code that is focused and easy to reason about. Large files " +
        "usually mix responsibilities and make changes harder to understand. This file " +
        "has {{lineCount}} lines, which is more than the allowed {{max}} lines. Make a " +
        "judgement call. If you decide that it is neccessary to keep this file this long, " +
        "suppress this rule with /* eslint-disable sensors/max-file-lines */",
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const max = options.max ?? DEFAULT_MAX_LINES;

    return {
      "Program:exit"(node) {
        const sourceCode = getSourceCode(context);
        const lineCount = sourceCode.lines.length;

        if (lineCount <= max) return;

        context.report({
          node,
          messageId: "tooManyLines",
          data: {
            lineCount,
            max,
          },
        });
      },
    };
  },
};

export default rule;
