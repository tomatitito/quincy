const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow default values in function parameters.",
    },
    schema: [],
    messages: {
      defaultParameter:
        "Default values in function parameters hide branching at the call boundary and make call sites harder to reason about. " +
        "Instead, we could either pass all values explicitely or hardcoding the value inside the function and make it parameterless. " +
        "If you still decide to stick with a default parameter, suppress this rule with // eslint-disable-next-line sensors/no-default-parameters",
    },
  },

  create(context) {
    const reportDefaultParameter = (node) => {
      for (const parameter of node.params ?? []) reportAssignmentPattern(parameter);
    };

    const reportAssignmentPattern = (node) => {
      if (node === undefined) return;

      if (node.type === "AssignmentPattern") {
        context.report({ node, messageId: "defaultParameter" });
        return;
      }

      if (node.type === "ArrayPattern") {
        for (const element of node.elements) if (element !== null) reportAssignmentPattern(element);
        return;
      }

      if (node.type === "ObjectPattern") {
        for (const property of node.properties) reportAssignmentPattern(property.value ?? property.argument);
        return;
      }

      if (node.type === "RestElement") return;
      if (node.type === "TSParameterProperty") reportAssignmentPattern(node.parameter);
    };

    return {
      ArrowFunctionExpression: reportDefaultParameter,
      FunctionDeclaration: reportDefaultParameter,
      FunctionExpression: reportDefaultParameter,
    };
  },
};

export default rule;
