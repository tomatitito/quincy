const isFunctionProperty = (member) => {
  const annotation = member.typeAnnotation?.typeAnnotation;
  return member.type === "TSPropertySignature" && annotation?.type === "TSFunctionType";
};

const isSingleMethodInterface = (node) => {
  const members = node.body?.body ?? [];
  if (members.length !== 1) return false;
  return members[0].type === "TSMethodSignature" || isFunctionProperty(members[0]);
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow interfaces that only describe a single function.",
    },
    schema: [],
    messages: {
      singleMethodInterface:
        "We are aiming for a functional style that keeps behavior explicit, easy to reason " +
        "about, and easy to test. Interface '{{name}}' only describes one function, so the " +
        "object wrapper adds ceremony without useful structure. Prefer a function type alias, " +
        "for example `type {{name}} = (...) => ...`, and pass that function directly.",
    },
  },

  create(context) {
    return {
      TSInterfaceDeclaration(node) {
        if (!isSingleMethodInterface(node)) return;
        context.report({ node, messageId: "singleMethodInterface", data: { name: node.id.name } });
      },
    };
  },
};

export default rule;
