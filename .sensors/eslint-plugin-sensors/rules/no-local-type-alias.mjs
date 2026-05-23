const HIGH_LEVEL_MODULE_PATH_PARTS = ["/src/lib/domain/", "/src/lib/application/"];

const normalizePath = (path) => path.replaceAll("\\", "/");

const isInHighLevelModule = (filename) => {
  const normalized = normalizePath(filename);
  return HIGH_LEVEL_MODULE_PATH_PARTS.some((part) => normalized.includes(part));
};

const getReferencedTypeName = (typeAnnotation) => {
  if (typeAnnotation?.type !== "TSTypeReference") return null;

  const typeName = typeAnnotation.typeName;
  return typeName?.type === "Identifier" ? typeName.name : null;
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow local type aliases in high-level modules.",
    },
    schema: [],
    messages: {
      localTypeAlias:
        "We want to express semantic meaning using types where possible, while keeping " +
        "the number of types to a minimum. Therefore we disallow exported or local type aliases " +
        "that only rename another type declared in the same high-level module file. Avoid " +
        "aliasing local type '{{targetName}}' as '{{aliasName}}'; use one canonical name instead.",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    if (!isInHighLevelModule(filename)) {
      return {};
    }

    const declaredTypeNames = new Set();
    const aliasesToCheck = [];

    return {
      TSTypeAliasDeclaration(node) {
        declaredTypeNames.add(node.id.name);
        aliasesToCheck.push(node);
      },

      "Program:exit"() {
        for (const node of aliasesToCheck) {
          const targetName = getReferencedTypeName(node.typeAnnotation);
          if (!targetName || !declaredTypeNames.has(targetName)) continue;

          context.report({
            node,
            messageId: "localTypeAlias",
            data: {
              aliasName: node.id.name,
              targetName,
            },
          });
        }
      },
    };
  },
};

export default rule;
