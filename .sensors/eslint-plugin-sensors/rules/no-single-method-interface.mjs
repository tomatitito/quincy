const isFunctionProperty = (member) => {
  const annotation = member.typeAnnotation?.typeAnnotation;
  return member.type === "TSPropertySignature" && annotation?.type === "TSFunctionType";
};

const isSingleMethodInterface = (node) => {
  const members = node.body?.body ?? [];
  if (members.length !== 1) return false;
  return members[0].type === "TSMethodSignature" || isFunctionProperty(members[0]);
};

const isSingleMethodClass = (node) => {
  const members = node.body?.body ?? [];
  if (members.length !== 1) return false;
  const [member] = members;
  return member.type === "MethodDefinition" && member.kind !== "constructor";
};

const getClassName = (node) => node.id?.name ?? "anonymous class";

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow interfaces and classes that only describe a single function.",
    },
    schema: [],
    messages: {
      singleMethodInterface:
        "We are aiming for a functional style that keeps behavior explicit, easy to reason " +
        "about, and easy to test. {{kind}} '{{name}}' only describes one function, so the " +
        "object wrapper adds ceremony without useful structure. Prefer a function type alias, " +
        "for example `type {{name}} = (...) => ...`, and pass that function directly.",
    },
  },

  create(context) {
    return {
      TSInterfaceDeclaration(node) {
        if (!isSingleMethodInterface(node)) return;
        context.report({
          node,
          messageId: "singleMethodInterface",
          data: { kind: "Interface", name: node.id.name },
        });
      },
      ClassDeclaration(node) {
        if (!isSingleMethodClass(node)) return;
        context.report({
          node,
          messageId: "singleMethodInterface",
          data: { kind: "Class", name: getClassName(node) },
        });
      },
      ClassExpression(node) {
        if (!isSingleMethodClass(node)) return;
        context.report({
          node,
          messageId: "singleMethodInterface",
          data: { kind: "Class", name: getClassName(node) },
        });
      },
    };
  },
};

export default rule;
