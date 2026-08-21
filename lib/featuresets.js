
/**
 * @typedef OCPPFeatureSet
 * @prop {boolean} enableOcpp16DeprecatedErrorCodes
 * @prop {boolean} enableCallResultError
 * @prop {boolean} enableSend
 */

/**
 * 
 * @returns {OCPPFeatureSet}
 */
export function getDefaultFeatureSet() {
    /** @type {OCPPFeatureSet} */
    const features = {
        enableOcpp16DeprecatedErrorCodes: false,
        enableCallResultError: true,
        enableSend: true,
    };

    return features;
}

/**
 * 
 * @param {string} protocol 
 * @returns {OCPPFeatureSet}
 */
export function getProtocolFeatureSet(protocol) {

    // The default featureset should always be correct for the most recent version of the OCPP-J specification.
    // This way, non-standard/custom protocols can always benefit from the latest features.

    const features = getDefaultFeatureSet();

    switch (protocol) {
        case 'ocpp1.2':
        case 'ocpp1.5':
        case 'ocpp1.6': {
            features.enableOcpp16DeprecatedErrorCodes = true;
            features.enableCallResultError = false;
            features.enableSend = false;
            break;
        }
        case 'ocpp2.0':
        case 'ocpp2.0.1': {
            features.enableCallResultError = false;
            features.enableSend = false;
            break;
        }
        case 'ocpp2.1': {

            break;
        }
    }

    return features;
}

