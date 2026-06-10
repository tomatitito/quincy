import maxFileLines from "./rules/max-file-lines.mjs";
import maxFunctionLines from "./rules/max-function-lines.mjs";
import mutatedParamMustBeReturned from "./rules/mutated-param-must-be-returned.mjs";
import noClasses from "./rules/no-classes.mjs";
import noDefaultParameters from "./rules/no-default-parameters.mjs";
import noDomainPrimitives from "./rules/no-domain-primitives.mjs";
import noLocalTypeAlias from "./rules/no-local-type-alias.mjs";
import noOverbroadParameterObject from "./rules/no-overbroad-parameter-object.mjs";
import noSideEffectsInMap from "./rules/no-side-effects-in-map.mjs";
import noSingleMethodInterface from "./rules/no-single-method-interface.mjs";
import noVoidReturnFunctions from "./rules/no-void-return-functions.mjs";

export default {
  rules: {
    "max-file-lines": maxFileLines,
    "max-function-lines": maxFunctionLines,
    "mutated-param-must-be-returned": mutatedParamMustBeReturned,
    "no-classes": noClasses,
    "no-default-parameters": noDefaultParameters,
    "no-domain-primitives": noDomainPrimitives,
    "no-local-type-alias": noLocalTypeAlias,
    "no-overbroad-parameter-object": noOverbroadParameterObject,
    "no-side-effects-in-map": noSideEffectsInMap,
    "no-single-method-interface": noSingleMethodInterface,
    "no-void-return-functions": noVoidReturnFunctions,
  },
};
