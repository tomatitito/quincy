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

const isFunctionNode = (node) =>
  node.type === "FunctionDeclaration" ||
  node.type === "FunctionExpression" ||
  node.type === "ArrowFunctionExpression";

const isMapCall = (node) => {
  if (node.callee?.type !== "MemberExpression") return false;
  return getStaticPropertyName(node.callee.property) === "map";
};

const isMutatingMethodCall = (node) => {
  if (node.type !== "CallExpression") return false;
  if (node.callee?.type !== "MemberExpression") return false;
  return MUTATING_METHODS.has(getStaticPropertyName(node.callee.property));
};

const traverse = (node, visitor) => {
  if (!node || typeof node.type !== "string") return;

  const shouldContinue = visitor(node) !== false;
  if (!shouldContinue) return;

  for (const key of Object.keys(node)) {
    if (key === "parent") continue;

    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        traverse(item, visitor);
      }
    } else if (value && typeof value.type === "string") {
      traverse(value, visitor);
    }
  }
};

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow side effects inside Array.prototype.map callbacks.",
    },
    schema: [],
    messages: {
      expressionStatement:
        "We are aiming for a rather functional style that features referential transparency " +
        "and code that is easy to reason about. Therefore we avoid side-effect statements inside " +
        ".map(); compute the mapped value here and build indexes in a separate explicit step.",
      assignment:
        "We are aiming for a rather functional style that features referential transparency " +
        "and code that is easy to reason about. Therefore we avoid assignments inside " +
        ".map() callbacks; compute the mapped value here and build indexes in a separate " +
        "explicit step.",
      update:
        "We are aiming for a rather functional style that features referential transparency " +
        "and code that is easy to reason about. Therefore we avoid update expressions inside " +
        ".map() callbacks; compute the mapped value here and build indexes in a separate " +
        "explicit step.",
      mutatingCall:
        "We are aiming for a rather functional style that features referential transparency " +
        "and code that is easy to reason about. Therefore we avoid mutating method calls inside " +
        ".map() callbacks; compute the mapped value here and build indexes in a separate " +
        "explicit step.",
    },
  },

  create(context) {
    const checkCallback = (callback) => {
      traverse(callback.body, (node) => {
        if (node !== callback.body && isFunctionNode(node)) {
          return false;
        }

        if (node.type === "ExpressionStatement") {
          context.report({ node, messageId: "expressionStatement" });
          return false;
        }

        if (node.type === "AssignmentExpression") {
          context.report({ node, messageId: "assignment" });
          return false;
        }

        if (node.type === "UpdateExpression") {
          context.report({ node, messageId: "update" });
          return false;
        }

        if (isMutatingMethodCall(node)) {
          context.report({ node, messageId: "mutatingCall" });
          return false;
        }

        return true;
      });
    };

    return {
      CallExpression(node) {
        if (!isMapCall(node)) return;

        const callback = node.arguments[0];
        if (!callback || !isFunctionNode(callback)) return;

        checkCallback(callback);
      },
    };
  },
};

export default rule;
