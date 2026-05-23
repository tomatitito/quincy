const getClassName = (node) => node.id?.name ?? "<anonymous>";

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow classes.",
    },
    schema: [],
    messages: {
      classUsed:
        "We are aiming for a functional style that features referential transparency " +
        "and code that is easy to reason about. Classes usually combine data, behavior, " +
        "and mutable state in ways that make code harder to test. Avoid class '{{name}}'; " +
        "prefer plain data structures and small functions unless a class is truly necessary." +
        "Make a judgement call about this. If you decide to use a class, suppress this rule " +
        "with // eslint-disable-next-line sensors/no-classes",
        
    },
  },

  create(context) {
    const reportClass = (node) => {
      context.report({
        node,
        messageId: "classUsed",
        data: { name: getClassName(node) },
      });
    };

    return {
      ClassDeclaration: reportClass,
      ClassExpression: reportClass,
    };
  },
};

export default rule;
