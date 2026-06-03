const CONFIG_PARAMETER_NAME = /(?:config|options|opts|params|props)$/iu;
const CONFIG_TYPE_NAME = /(?:Config|Options|Params|Props)$/u;

const functionNodeTypes = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

const isConfigLikeName = (name) => CONFIG_PARAMETER_NAME.test(name);
const isConfigLikeType = (param) => {
  const typeAnnotation = param.typeAnnotation?.typeAnnotation;
  if (typeAnnotation?.type === "TSTypeLiteral") return true;
  if (typeAnnotation?.type !== "TSTypeReference") return false;
  const typeName = typeAnnotation.typeName;
  return typeName?.type === "Identifier" && CONFIG_TYPE_NAME.test(typeName.name);
};

const isObjectLikeParameter = (param) => {
  return param.type === "Identifier" && (isConfigLikeName(param.name) || isConfigLikeType(param));
};

const isPropertyRead = (node, parameterName) => {
  const parent = node.parent;
  if (parent?.type !== "MemberExpression" || parent.object !== node) return false;
  if (parent.computed) return parent.property.type === "Literal" && typeof parent.property.value === "string";
  return parent.property.type === "Identifier";
};

const getPropertyName = (member) => {
  if (member.computed) return String(member.property.value);
  return member.property.name;
};

const shadowsParameter = (node, parameterName) => {
  return node.params.some((param) => param.type === "Identifier" && param.name === parameterName);
};

const collectParameterUses = (root, parameterName) => {
  const properties = new Set();
  let usedWholeObject = false;

  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node !== root && functionNodeTypes.has(node.type) && shadowsParameter(node, parameterName)) return;

    if (node.type === "Identifier" && node.name === parameterName) {
      if (isPropertyRead(node, parameterName)) {
        properties.add(getPropertyName(node.parent));
      } else {
        usedWholeObject = true;
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "parent") continue;
      if (Array.isArray(value)) {
        for (const child of value) visit(child);
      } else {
        visit(value);
      }
    }
  };

  visit(root.body);
  return { properties, usedWholeObject };
};

const checkFunction = (context, node) => {
  for (const param of node.params) {
    if (!isObjectLikeParameter(param)) continue;

    const { properties, usedWholeObject } = collectParameterUses(node, param.name);
    if (usedWholeObject || properties.size !== 1) continue;

    const [propertyName] = properties;
    context.report({
      node: param,
      messageId: "overbroadParameterObject",
      data: { parameterName: param.name, propertyName },
    });
  }
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow config/options parameters when only one property is read.",
    },
    schema: [],
    messages: {
      overbroadParameterObject:
        "Parameter '{{parameterName}}' is an object, but this function only reads " +
        "'{{propertyName}}'. Prefer passing the specific '{{propertyName}}' value instead " +
        "of the whole object.",
    },
  },

  create(context) {
    return {
      ArrowFunctionExpression(node) {
        checkFunction(context, node);
      },
      FunctionDeclaration(node) {
        checkFunction(context, node);
      },
      FunctionExpression(node) {
        checkFunction(context, node);
      },
    };
  },
};

export default rule;
