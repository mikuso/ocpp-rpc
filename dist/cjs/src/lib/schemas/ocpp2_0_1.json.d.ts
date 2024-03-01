/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";
/**
 * Used algorithms for the hashes provided.
 *
 */
export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";

export interface AuthorizeRequest {
  customData?: CustomDataType;
  idToken: IdTokenType;
  /**
   * The X.509 certificated presented by EV and encoded in PEM format.
   *
   */
  certificate?: string;
  /**
   * @minItems 1
   * @maxItems 4
   */
  iso15118CertificateHashData?: OCSPRequestDataType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}
export interface OCSPRequestDataType {
  customData?: CustomDataType;
  hashAlgorithm: HashAlgorithmEnumType;
  /**
   * Hashed value of the Issuer DN (Distinguished Name).
   *
   *
   */
  issuerNameHash: string;
  /**
   * Hashed value of the issuers public key
   *
   */
  issuerKeyHash: string;
  /**
   * The serial number of the certificate.
   *
   */
  serialNumber: string;
  /**
   * This contains the responder URL (Case insensitive).
   *
   *
   */
  responderURL: string;
}

/**
 * ID_ Token. Status. Authorization_ Status
 * urn:x-oca:ocpp:uid:1:569372
 * Current status of the ID Token.
 *
 */
export type AuthorizationStatusEnumType =
  | "Accepted"
  | "Blocked"
  | "ConcurrentTx"
  | "Expired"
  | "Invalid"
  | "NoCredit"
  | "NotAllowedTypeEVSE"
  | "NotAtThisLocation"
  | "NotAtThisTime"
  | "Unknown";
/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";
/**
 * Message_ Content. Format. Message_ Format_ Code
 * urn:x-enexis:ecdm:uid:1:570848
 * Format of the message.
 *
 */
export type MessageFormatEnumType = "ASCII" | "HTML" | "URI" | "UTF8";
/**
 * Certificate status information.
 * - if all certificates are valid: return 'Accepted'.
 * - if one of the certificates was revoked, return 'CertificateRevoked'.
 *
 */
export type AuthorizeCertificateStatusEnumType =
  | "Accepted"
  | "SignatureError"
  | "CertificateExpired"
  | "CertificateRevoked"
  | "NoCertificateAvailable"
  | "CertChainError"
  | "ContractCancelled";

export interface AuthorizeResponse {
  customData?: CustomDataType;
  idTokenInfo: IdTokenInfoType;
  certificateStatus?: AuthorizeCertificateStatusEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * ID_ Token
 * urn:x-oca:ocpp:uid:2:233247
 * Contains status information about an identifier.
 * It is advised to not stop charging for a token that expires during charging, as ExpiryDate is only used for caching purposes. If ExpiryDate is not given, the status has no end date.
 *
 */
export interface IdTokenInfoType {
  customData?: CustomDataType;
  status: AuthorizationStatusEnumType;
  /**
   * ID_ Token. Expiry. Date_ Time
   * urn:x-oca:ocpp:uid:1:569373
   * Date and Time after which the token must be considered invalid.
   *
   */
  cacheExpiryDateTime?: string;
  /**
   * Priority from a business point of view. Default priority is 0, The range is from -9 to 9. Higher values indicate a higher priority. The chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; overrules this one.
   *
   */
  chargingPriority?: number;
  /**
   * ID_ Token. Language1. Language_ Code
   * urn:x-oca:ocpp:uid:1:569374
   * Preferred user interface language of identifier user. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   *
   */
  language1?: string;
  /**
   * Only used when the IdToken is only valid for one or more specific EVSEs, not for the entire Charging Station.
   *
   *
   *
   * @minItems 1
   */
  evseId?: number[];
  groupIdToken?: IdTokenType;
  /**
   * ID_ Token. Language2. Language_ Code
   * urn:x-oca:ocpp:uid:1:569375
   * Second preferred user interface language of identifier user. Don’t use when language1 is omitted, has to be different from language1. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language2?: string;
  personalMessage?: MessageContentType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}
/**
 * Message_ Content
 * urn:x-enexis:ecdm:uid:2:234490
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 *
 */
export interface MessageContentType {
  customData?: CustomDataType;
  format: MessageFormatEnumType;
  /**
   * Message_ Content. Language. Language_ Code
   * urn:x-enexis:ecdm:uid:1:570849
   * Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language?: string;
  /**
   * Message_ Content. Content. Message
   * urn:x-enexis:ecdm:uid:1:570852
   * Message contents.
   *
   *
   */
  content: string;
}

/**
 * This contains the reason for sending this message to the CSMS.
 *
 */
export type BootReasonEnumType =
  | "ApplicationReset"
  | "FirmwareUpdate"
  | "LocalReset"
  | "PowerUp"
  | "RemoteReset"
  | "ScheduledReset"
  | "Triggered"
  | "Unknown"
  | "Watchdog";

export interface BootNotificationRequest {
  customData?: CustomDataType;
  chargingStation: ChargingStationType;
  reason: BootReasonEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charge_ Point
 * urn:x-oca:ocpp:uid:2:233122
 * The physical system where an Electrical Vehicle (EV) can be charged.
 *
 */
export interface ChargingStationType {
  customData?: CustomDataType;
  /**
   * Device. Serial_ Number. Serial_ Number
   * urn:x-oca:ocpp:uid:1:569324
   * Vendor-specific device identifier.
   *
   */
  serialNumber?: string;
  /**
   * Device. Model. CI20_ Text
   * urn:x-oca:ocpp:uid:1:569325
   * Defines the model of the device.
   *
   */
  model: string;
  modem?: ModemType;
  /**
   * Identifies the vendor (not necessarily in a unique manner).
   *
   */
  vendorName: string;
  /**
   * This contains the firmware version of the Charging Station.
   *
   *
   */
  firmwareVersion?: string;
}
/**
 * Wireless_ Communication_ Module
 * urn:x-oca:ocpp:uid:2:233306
 * Defines parameters required for initiating and maintaining wireless communication with other devices.
 *
 */
export interface ModemType {
  customData?: CustomDataType;
  /**
   * Wireless_ Communication_ Module. ICCID. CI20_ Text
   * urn:x-oca:ocpp:uid:1:569327
   * This contains the ICCID of the modem’s SIM card.
   *
   */
  iccid?: string;
  /**
   * Wireless_ Communication_ Module. IMSI. CI20_ Text
   * urn:x-oca:ocpp:uid:1:569328
   * This contains the IMSI of the modem’s SIM card.
   *
   */
  imsi?: string;
}

/**
 * This contains whether the Charging Station has been registered
 * within the CSMS.
 *
 */
export type RegistrationStatusEnumType = "Accepted" | "Pending" | "Rejected";

export interface BootNotificationResponse {
  customData?: CustomDataType;
  /**
   * This contains the CSMS’s current time.
   *
   */
  currentTime: string;
  /**
   * When &lt;&lt;cmn_registrationstatusenumtype,Status&gt;&gt; is Accepted, this contains the heartbeat interval in seconds. If the CSMS returns something other than Accepted, the value of the interval field indicates the minimum wait time before sending a next BootNotification request.
   *
   */
  interval: number;
  status: RegistrationStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface CancelReservationRequest {
  customData?: CustomDataType;
  /**
   * Id of the reservation to cancel.
   *
   */
  reservationId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This indicates the success or failure of the canceling of a reservation by CSMS.
 *
 */
export type CancelReservationStatusEnumType = "Accepted" | "Rejected";

export interface CancelReservationResponse {
  customData?: CustomDataType;
  status: CancelReservationStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Indicates the type of the signed certificate that is returned. When omitted the certificate is used for both the 15118 connection (if implemented) and the Charging Station to CSMS connection. This field is required when a typeOfCertificate was included in the &lt;&lt;signcertificaterequest,SignCertificateRequest&gt;&gt; that requested this certificate to be signed AND both the 15118 connection and the Charging Station connection are implemented.
 *
 *
 */
export type CertificateSigningUseEnumType = "ChargingStationCertificate" | "V2GCertificate";

export interface CertificateSignedRequest {
  customData?: CustomDataType;
  /**
   * The signed PEM encoded X.509 certificate. This can also contain the necessary sub CA certificates. In that case, the order of the bundle should follow the certificate chain, starting from the leaf certificate.
   *
   * The Configuration Variable &lt;&lt;configkey-max-certificate-chain-size,MaxCertificateChainSize&gt;&gt; can be used to limit the maximum size of this field.
   *
   */
  certificateChain: string;
  certificateType?: CertificateSigningUseEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Returns whether certificate signing has been accepted, otherwise rejected.
 *
 */
export type CertificateSignedStatusEnumType = "Accepted" | "Rejected";

export interface CertificateSignedResponse {
  customData?: CustomDataType;
  status: CertificateSignedStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This contains the type of availability change that the Charging Station should perform.
 *
 *
 */
export type OperationalStatusEnumType = "Inoperative" | "Operative";

export interface ChangeAvailabilityRequest {
  customData?: CustomDataType;
  evse?: EVSEType;
  operationalStatus: OperationalStatusEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}

/**
 * This indicates whether the Charging Station is able to perform the availability change.
 *
 */
export type ChangeAvailabilityStatusEnumType = "Accepted" | "Rejected" | "Scheduled";

export interface ChangeAvailabilityResponse {
  customData?: CustomDataType;
  status: ChangeAvailabilityStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface ClearCacheRequest {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Accepted if the Charging Station has executed the request, otherwise rejected.
 *
 */
export type ClearCacheStatusEnumType = "Accepted" | "Rejected";

export interface ClearCacheResponse {
  customData?: CustomDataType;
  status: ClearCacheStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Charging_ Profile. Charging_ Profile_ Purpose. Charging_ Profile_ Purpose_ Code
 * urn:x-oca:ocpp:uid:1:569231
 * Specifies to purpose of the charging profiles that will be cleared, if they meet the other criteria in the request.
 *
 */
export type ChargingProfilePurposeEnumType =
  | "ChargingStationExternalConstraints"
  | "ChargingStationMaxProfile"
  | "TxDefaultProfile"
  | "TxProfile";

export interface ClearChargingProfileRequest {
  customData?: CustomDataType;
  /**
   * The Id of the charging profile to clear.
   *
   */
  chargingProfileId?: number;
  chargingProfileCriteria?: ClearChargingProfileType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of a ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ClearChargingProfileType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Specifies the id of the EVSE for which to clear charging profiles. An evseId of zero (0) specifies the charging profile for the overall Charging Station. Absence of this parameter means the clearing applies to all charging profiles that match the other criteria in the request.
   *
   *
   */
  evseId?: number;
  chargingProfilePurpose?: ChargingProfilePurposeEnumType;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Specifies the stackLevel for which charging profiles will be cleared, if they meet the other criteria in the request.
   *
   */
  stackLevel?: number;
}

/**
 * Indicates if the Charging Station was able to execute the request.
 *
 */
export type ClearChargingProfileStatusEnumType = "Accepted" | "Unknown";

export interface ClearChargingProfileResponse {
  customData?: CustomDataType;
  status: ClearChargingProfileStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface ClearDisplayMessageRequest {
  customData?: CustomDataType;
  /**
   * Id of the message that SHALL be removed from the Charging Station.
   *
   */
  id: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Returns whether the Charging Station has been able to remove the message.
 *
 */
export type ClearMessageStatusEnumType = "Accepted" | "Unknown";

export interface ClearDisplayMessageResponse {
  customData?: CustomDataType;
  status: ClearMessageStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Source of the charging limit.
 *
 */
export type ChargingLimitSourceEnumType = "EMS" | "Other" | "SO" | "CSO";

export interface ClearedChargingLimitRequest {
  customData?: CustomDataType;
  chargingLimitSource: ChargingLimitSourceEnumType;
  /**
   * EVSE Identifier.
   *
   */
  evseId?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface ClearedChargingLimitResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface ClearVariableMonitoringRequest {
  customData?: CustomDataType;
  /**
   * List of the monitors to be cleared, identified by there Id.
   *
   *
   * @minItems 1
   */
  id: number[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Result of the clear request for this monitor, identified by its Id.
 *
 *
 */
export type ClearMonitoringStatusEnumType = "Accepted" | "Rejected" | "NotFound";

export interface ClearVariableMonitoringResponse {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  clearMonitoringResult: ClearMonitoringResultType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface ClearMonitoringResultType {
  customData?: CustomDataType;
  status: ClearMonitoringStatusEnumType;
  /**
   * Id of the monitor of which a clear was requested.
   *
   *
   */
  id: number;
  statusInfo?: StatusInfoType;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface CostUpdatedRequest {
  customData?: CustomDataType;
  /**
   * Current total cost, based on the information known by the CSMS, of the transaction including taxes. In the currency configured with the configuration Variable: [&lt;&lt;configkey-currency, Currency&gt;&gt;]
   *
   *
   */
  totalCost: number;
  /**
   * Transaction Id of the transaction the current cost are asked for.
   *
   *
   */
  transactionId: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface CostUpdatedResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Used algorithms for the hashes provided.
 *
 */
export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";
/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";

export interface CustomerInformationRequest {
  customData?: CustomDataType;
  customerCertificate?: CertificateHashDataType;
  idToken?: IdTokenType;
  /**
   * The Id of the request.
   *
   *
   */
  requestId: number;
  /**
   * Flag indicating whether the Charging Station should return NotifyCustomerInformationRequest messages containing information about the customer referred to.
   *
   */
  report: boolean;
  /**
   * Flag indicating whether the Charging Station should clear all information about the customer referred to.
   *
   */
  clear: boolean;
  /**
   * A (e.g. vendor specific) identifier of the customer this request refers to. This field contains a custom identifier other than IdToken and Certificate.
   * One of the possible identifiers (customerIdentifier, customerIdToken or customerCertificate) should be in the request message.
   *
   */
  customerIdentifier?: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface CertificateHashDataType {
  customData?: CustomDataType;
  hashAlgorithm: HashAlgorithmEnumType;
  /**
   * Hashed value of the Issuer DN (Distinguished Name).
   *
   *
   */
  issuerNameHash: string;
  /**
   * Hashed value of the issuers public key
   *
   */
  issuerKeyHash: string;
  /**
   * The serial number of the certificate.
   *
   */
  serialNumber: string;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}

/**
 * Indicates whether the request was accepted.
 *
 */
export type CustomerInformationStatusEnumType = "Accepted" | "Rejected" | "Invalid";

export interface CustomerInformationResponse {
  customData?: CustomDataType;
  status: CustomerInformationStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface DataTransferRequest {
  customData?: CustomDataType;
  /**
   * May be used to indicate a specific message or implementation.
   *
   */
  messageId?: string;
  /**
   * Data without specified length or format. This needs to be decided by both parties (Open to implementation).
   *
   */
  data?: {
    [k: string]: unknown;
  };
  /**
   * This identifies the Vendor specific implementation
   *
   *
   */
  vendorId: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This indicates the success or failure of the data transfer.
 *
 */
export type DataTransferStatusEnumType = "Accepted" | "Rejected" | "UnknownMessageId" | "UnknownVendorId";

export interface DataTransferResponse {
  customData?: CustomDataType;
  status: DataTransferStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * Data without specified length or format, in response to request.
   *
   */
  data?: {
    [k: string]: unknown;
  };
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Used algorithms for the hashes provided.
 *
 */
export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";

export interface DeleteCertificateRequest {
  customData?: CustomDataType;
  certificateHashData: CertificateHashDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface CertificateHashDataType {
  customData?: CustomDataType;
  hashAlgorithm: HashAlgorithmEnumType;
  /**
   * Hashed value of the Issuer DN (Distinguished Name).
   *
   *
   */
  issuerNameHash: string;
  /**
   * Hashed value of the issuers public key
   *
   */
  issuerKeyHash: string;
  /**
   * The serial number of the certificate.
   *
   */
  serialNumber: string;
}

/**
 * Charging Station indicates if it can process the request.
 *
 */
export type DeleteCertificateStatusEnumType = "Accepted" | "Failed" | "NotFound";

export interface DeleteCertificateResponse {
  customData?: CustomDataType;
  status: DeleteCertificateStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This contains the progress status of the firmware installation.
 *
 */
export type FirmwareStatusEnumType =
  | "Downloaded"
  | "DownloadFailed"
  | "Downloading"
  | "DownloadScheduled"
  | "DownloadPaused"
  | "Idle"
  | "InstallationFailed"
  | "Installing"
  | "Installed"
  | "InstallRebooting"
  | "InstallScheduled"
  | "InstallVerificationFailed"
  | "InvalidSignature"
  | "SignatureVerified";

export interface FirmwareStatusNotificationRequest {
  customData?: CustomDataType;
  status: FirmwareStatusEnumType;
  /**
   * The request id that was provided in the
   * UpdateFirmwareRequest that started this firmware update.
   * This field is mandatory, unless the message was triggered by a TriggerMessageRequest AND there is no firmware update ongoing.
   *
   */
  requestId?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface FirmwareStatusNotificationResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Defines whether certificate needs to be installed or updated.
 *
 */
export type CertificateActionEnumType = "Install" | "Update";

export interface Get15118EVCertificateRequest {
  customData?: CustomDataType;
  /**
   * Schema version currently used for the 15118 session between EV and Charging Station. Needed for parsing of the EXI stream by the CSMS.
   *
   *
   */
  iso15118SchemaVersion: string;
  action: CertificateActionEnumType;
  /**
   * Raw CertificateInstallationReq request from EV, Base64 encoded.
   *
   */
  exiRequest: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates whether the message was processed properly.
 *
 */
export type Iso15118EVCertificateStatusEnumType = "Accepted" | "Failed";

export interface Get15118EVCertificateResponse {
  customData?: CustomDataType;
  status: Iso15118EVCertificateStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * Raw CertificateInstallationRes response for the EV, Base64 encoded.
   *
   */
  exiResponse: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This field specifies the report base.
 *
 */
export type ReportBaseEnumType = "ConfigurationInventory" | "FullInventory" | "SummaryInventory";

export interface GetBaseReportRequest {
  customData?: CustomDataType;
  /**
   * The Id of the request.
   *
   */
  requestId: number;
  reportBase: ReportBaseEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This indicates whether the Charging Station is able to accept this request.
 *
 */
export type GenericDeviceModelStatusEnumType = "Accepted" | "Rejected" | "NotSupported" | "EmptyResultSet";

export interface GetBaseReportResponse {
  customData?: CustomDataType;
  status: GenericDeviceModelStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Used algorithms for the hashes provided.
 *
 */
export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";

export interface GetCertificateStatusRequest {
  customData?: CustomDataType;
  ocspRequestData: OCSPRequestDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface OCSPRequestDataType {
  customData?: CustomDataType;
  hashAlgorithm: HashAlgorithmEnumType;
  /**
   * Hashed value of the Issuer DN (Distinguished Name).
   *
   *
   */
  issuerNameHash: string;
  /**
   * Hashed value of the issuers public key
   *
   */
  issuerKeyHash: string;
  /**
   * The serial number of the certificate.
   *
   */
  serialNumber: string;
  /**
   * This contains the responder URL (Case insensitive).
   *
   *
   */
  responderURL: string;
}

/**
 * This indicates whether the charging station was able to retrieve the OCSP certificate status.
 *
 */
export type GetCertificateStatusEnumType = "Accepted" | "Failed";

export interface GetCertificateStatusResponse {
  customData?: CustomDataType;
  status: GetCertificateStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * OCSPResponse class as defined in &lt;&lt;ref-ocpp_security_24, IETF RFC 6960&gt;&gt;. DER encoded (as defined in &lt;&lt;ref-ocpp_security_24, IETF RFC 6960&gt;&gt;), and then base64 encoded. MAY only be omitted when status is not Accepted.
   *
   */
  ocspResult?: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Charging_ Profile. Charging_ Profile_ Purpose. Charging_ Profile_ Purpose_ Code
 * urn:x-oca:ocpp:uid:1:569231
 * Defines the purpose of the schedule transferred by this profile
 *
 */
export type ChargingProfilePurposeEnumType =
  | "ChargingStationExternalConstraints"
  | "ChargingStationMaxProfile"
  | "TxDefaultProfile"
  | "TxProfile";
export type ChargingLimitSourceEnumType = "EMS" | "Other" | "SO" | "CSO";

export interface GetChargingProfilesRequest {
  customData?: CustomDataType;
  /**
   * Reference identification that is to be used by the Charging Station in the &lt;&lt;reportchargingprofilesrequest, ReportChargingProfilesRequest&gt;&gt; when provided.
   *
   */
  requestId: number;
  /**
   * For which EVSE installed charging profiles SHALL be reported. If 0, only charging profiles installed on the Charging Station itself (the grid connection) SHALL be reported. If omitted, all installed charging profiles SHALL be reported.
   *
   */
  evseId?: number;
  chargingProfile: ChargingProfileCriterionType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ChargingProfileCriterionType {
  customData?: CustomDataType;
  chargingProfilePurpose?: ChargingProfilePurposeEnumType;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0.
   *
   */
  stackLevel?: number;
  /**
   * List of all the chargingProfileIds requested. Any ChargingProfile that matches one of these profiles will be reported. If omitted, the Charging Station SHALL not filter on chargingProfileId. This field SHALL NOT contain more ids than set in &lt;&lt;configkey-charging-profile-entries,ChargingProfileEntries.maxLimit&gt;&gt;
   *
   *
   *
   * @minItems 1
   */
  chargingProfileId?: number[];
  /**
   * For which charging limit sources, charging profiles SHALL be reported. If omitted, the Charging Station SHALL not filter on chargingLimitSource.
   *
   *
   * @minItems 1
   * @maxItems 4
   */
  chargingLimitSource?: ChargingLimitSourceEnumType[];
}

/**
 * This indicates whether the Charging Station is able to process this request and will send &lt;&lt;reportchargingprofilesrequest, ReportChargingProfilesRequest&gt;&gt; messages.
 *
 */
export type GetChargingProfileStatusEnumType = "Accepted" | "NoProfiles";

export interface GetChargingProfilesResponse {
  customData?: CustomDataType;
  status: GetChargingProfileStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Can be used to force a power or current profile.
 *
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";

export interface GetCompositeScheduleRequest {
  customData?: CustomDataType;
  /**
   * Length of the requested schedule in seconds.
   *
   *
   */
  duration: number;
  chargingRateUnit?: ChargingRateUnitEnumType;
  /**
   * The ID of the EVSE for which the schedule is requested. When evseid=0, the Charging Station will calculate the expected consumption for the grid connection.
   *
   */
  evseId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * The Charging Station will indicate if it was
 * able to process the request
 *
 */
export type GenericStatusEnumType = "Accepted" | "Rejected";
/**
 * The unit of measure Limit is
 * expressed in.
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";

export interface GetCompositeScheduleResponse {
  customData?: CustomDataType;
  status: GenericStatusEnumType;
  statusInfo?: StatusInfoType;
  schedule?: CompositeScheduleType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}
/**
 * Composite_ Schedule
 * urn:x-oca:ocpp:uid:2:233362
 *
 */
export interface CompositeScheduleType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
  /**
   * The ID of the EVSE for which the
   * schedule is requested. When evseid=0, the
   * Charging Station calculated the expected
   * consumption for the grid connection.
   *
   */
  evseId: number;
  /**
   * Duration of the schedule in seconds.
   *
   */
  duration: number;
  /**
   * Composite_ Schedule. Start. Date_ Time
   * urn:x-oca:ocpp:uid:1:569456
   * Date and time at which the schedule becomes active. All time measurements within the schedule are relative to this timestamp.
   *
   */
  scheduleStart: string;
  chargingRateUnit: ChargingRateUnitEnumType;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number;
}

/**
 * If provided the Charging Station shall return Display Messages with the given priority only.
 *
 */
export type MessagePriorityEnumType = "AlwaysFront" | "InFront" | "NormalCycle";
/**
 * If provided the Charging Station shall return Display Messages with the given state only.
 *
 */
export type MessageStateEnumType = "Charging" | "Faulted" | "Idle" | "Unavailable";

export interface GetDisplayMessagesRequest {
  customData?: CustomDataType;
  /**
   * If provided the Charging Station shall return Display Messages of the given ids. This field SHALL NOT contain more ids than set in &lt;&lt;configkey-number-of-display-messages,NumberOfDisplayMessages.maxLimit&gt;&gt;
   *
   *
   *
   * @minItems 1
   */
  id?: number[];
  /**
   * The Id of this request.
   *
   */
  requestId: number;
  priority?: MessagePriorityEnumType;
  state?: MessageStateEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates if the Charging Station has Display Messages that match the request criteria in the &lt;&lt;getdisplaymessagesrequest,GetDisplayMessagesRequest&gt;&gt;
 *
 */
export type GetDisplayMessagesStatusEnumType = "Accepted" | "Unknown";

export interface GetDisplayMessagesResponse {
  customData?: CustomDataType;
  status: GetDisplayMessagesStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export type GetCertificateIdUseEnumType =
  | "V2GRootCertificate"
  | "MORootCertificate"
  | "CSMSRootCertificate"
  | "V2GCertificateChain"
  | "ManufacturerRootCertificate";

export interface GetInstalledCertificateIdsRequest {
  customData?: CustomDataType;
  /**
   * Indicates the type of certificates requested. When omitted, all certificate types are requested.
   *
   *
   * @minItems 1
   */
  certificateType?: GetCertificateIdUseEnumType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Charging Station indicates if it can process the request.
 *
 */
export type GetInstalledCertificateStatusEnumType = "Accepted" | "NotFound";
/**
 * Used algorithms for the hashes provided.
 *
 */
export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";
/**
 * Indicates the type of the requested certificate(s).
 *
 */
export type GetCertificateIdUseEnumType =
  | "V2GRootCertificate"
  | "MORootCertificate"
  | "CSMSRootCertificate"
  | "V2GCertificateChain"
  | "ManufacturerRootCertificate";

export interface GetInstalledCertificateIdsResponse {
  customData?: CustomDataType;
  status: GetInstalledCertificateStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * @minItems 1
   */
  certificateHashDataChain?: CertificateHashDataChainType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}
export interface CertificateHashDataChainType {
  customData?: CustomDataType;
  certificateHashData: CertificateHashDataType;
  certificateType: GetCertificateIdUseEnumType;
  /**
   * @minItems 1
   * @maxItems 4
   */
  childCertificateHashData?: CertificateHashDataType[];
}
export interface CertificateHashDataType {
  customData?: CustomDataType;
  hashAlgorithm: HashAlgorithmEnumType;
  /**
   * Hashed value of the Issuer DN (Distinguished Name).
   *
   *
   */
  issuerNameHash: string;
  /**
   * Hashed value of the issuers public key
   *
   */
  issuerKeyHash: string;
  /**
   * The serial number of the certificate.
   *
   */
  serialNumber: string;
}

export interface GetLocalListVersionRequest {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface GetLocalListVersionResponse {
  customData?: CustomDataType;
  /**
   * This contains the current version number of the local authorization list in the Charging Station.
   *
   */
  versionNumber: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This contains the type of log file that the Charging Station
 * should send.
 *
 */
export type LogEnumType = "DiagnosticsLog" | "SecurityLog";

export interface GetLogRequest {
  customData?: CustomDataType;
  log: LogParametersType;
  logType: LogEnumType;
  /**
   * The Id of this request
   *
   */
  requestId: number;
  /**
   * This specifies how many times the Charging Station must try to upload the log before giving up. If this field is not present, it is left to Charging Station to decide how many times it wants to retry.
   *
   */
  retries?: number;
  /**
   * The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charging Station to decide how long to wait between attempts.
   *
   */
  retryInterval?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Log
 * urn:x-enexis:ecdm:uid:2:233373
 * Generic class for the configuration of logging entries.
 *
 */
export interface LogParametersType {
  customData?: CustomDataType;
  /**
   * Log. Remote_ Location. URI
   * urn:x-enexis:ecdm:uid:1:569484
   * The URL of the location at the remote system where the log should be stored.
   *
   */
  remoteLocation: string;
  /**
   * Log. Oldest_ Timestamp. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569477
   * This contains the date and time of the oldest logging information to include in the diagnostics.
   *
   */
  oldestTimestamp?: string;
  /**
   * Log. Latest_ Timestamp. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569482
   * This contains the date and time of the latest logging information to include in the diagnostics.
   *
   */
  latestTimestamp?: string;
}

/**
 * This field indicates whether the Charging Station was able to accept the request.
 *
 */
export type LogStatusEnumType = "Accepted" | "Rejected" | "AcceptedCanceled";

export interface GetLogResponse {
  customData?: CustomDataType;
  status: LogStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * This contains the name of the log file that will be uploaded. This field is not present when no logging information is available.
   *
   */
  filename?: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export type MonitoringCriterionEnumType = "ThresholdMonitoring" | "DeltaMonitoring" | "PeriodicMonitoring";

export interface GetMonitoringReportRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  componentVariable?: ComponentVariableType[];
  /**
   * The Id of the request.
   *
   */
  requestId: number;
  /**
   * This field contains criteria for components for which a monitoring report is requested
   *
   *
   * @minItems 1
   * @maxItems 3
   */
  monitoringCriteria?: MonitoringCriterionEnumType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to report components, variables and variable attributes and characteristics.
 *
 */
export interface ComponentVariableType {
  customData?: CustomDataType;
  component: ComponentType;
  variable?: VariableType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * This field indicates whether the Charging Station was able to accept the request.
 *
 */
export type GenericDeviceModelStatusEnumType = "Accepted" | "Rejected" | "NotSupported" | "EmptyResultSet";

export interface GetMonitoringReportResponse {
  customData?: CustomDataType;
  status: GenericDeviceModelStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export type ComponentCriterionEnumType = "Active" | "Available" | "Enabled" | "Problem";

export interface GetReportRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  componentVariable?: ComponentVariableType[];
  /**
   * The Id of the request.
   *
   */
  requestId: number;
  /**
   * This field contains criteria for components for which a report is requested
   *
   *
   * @minItems 1
   * @maxItems 4
   */
  componentCriteria?: ComponentCriterionEnumType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to report components, variables and variable attributes and characteristics.
 *
 */
export interface ComponentVariableType {
  customData?: CustomDataType;
  component: ComponentType;
  variable?: VariableType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * This field indicates whether the Charging Station was able to accept the request.
 *
 */
export type GenericDeviceModelStatusEnumType = "Accepted" | "Rejected" | "NotSupported" | "EmptyResultSet";

export interface GetReportResponse {
  customData?: CustomDataType;
  status: GenericDeviceModelStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface GetTransactionStatusRequest {
  customData?: CustomDataType;
  /**
   * The Id of the transaction for which the status is requested.
   *
   */
  transactionId?: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface GetTransactionStatusResponse {
  customData?: CustomDataType;
  /**
   * Whether the transaction is still ongoing.
   *
   */
  ongoingIndicator?: boolean;
  /**
   * Whether there are still message to be delivered.
   *
   */
  messagesInQueue: boolean;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Attribute type for which value is requested. When absent, default Actual is assumed.
 *
 */
export type AttributeEnumType = "Actual" | "Target" | "MinSet" | "MaxSet";

export interface GetVariablesRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  getVariableData: GetVariableDataType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to hold parameters for GetVariables request.
 *
 */
export interface GetVariableDataType {
  customData?: CustomDataType;
  attributeType?: AttributeEnumType;
  component: ComponentType;
  variable: VariableType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * Result status of getting the variable.
 *
 *
 */
export type GetVariableStatusEnumType =
  | "Accepted"
  | "Rejected"
  | "UnknownComponent"
  | "UnknownVariable"
  | "NotSupportedAttributeType";
/**
 * Attribute type for which value is requested. When absent, default Actual is assumed.
 *
 */
export type AttributeEnumType = "Actual" | "Target" | "MinSet" | "MaxSet";

export interface GetVariablesResponse {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  getVariableResult: GetVariableResultType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to hold results of GetVariables request.
 *
 */
export interface GetVariableResultType {
  customData?: CustomDataType;
  attributeStatusInfo?: StatusInfoType;
  attributeStatus: GetVariableStatusEnumType;
  attributeType?: AttributeEnumType;
  /**
   * Value of requested attribute type of component-variable. This field can only be empty when the given status is NOT accepted.
   *
   * The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal.
   *
   *
   */
  attributeValue?: string;
  component: ComponentType;
  variable: VariableType;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

export interface HeartbeatRequest {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface HeartbeatResponse {
  customData?: CustomDataType;
  /**
   * Contains the current time of the CSMS.
   *
   */
  currentTime: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates the certificate type that is sent.
 *
 */
export type InstallCertificateUseEnumType =
  | "V2GRootCertificate"
  | "MORootCertificate"
  | "CSMSRootCertificate"
  | "ManufacturerRootCertificate";

export interface InstallCertificateRequest {
  customData?: CustomDataType;
  certificateType: InstallCertificateUseEnumType;
  /**
   * A PEM encoded X.509 certificate.
   *
   */
  certificate: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Charging Station indicates if installation was successful.
 *
 */
export type InstallCertificateStatusEnumType = "Accepted" | "Rejected" | "Failed";

export interface InstallCertificateResponse {
  customData?: CustomDataType;
  status: InstallCertificateStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This contains the status of the log upload.
 *
 */
export type UploadLogStatusEnumType =
  | "BadMessage"
  | "Idle"
  | "NotSupportedOperation"
  | "PermissionDenied"
  | "Uploaded"
  | "UploadFailure"
  | "Uploading"
  | "AcceptedCanceled";

export interface LogStatusNotificationRequest {
  customData?: CustomDataType;
  status: UploadLogStatusEnumType;
  /**
   * The request id that was provided in GetLogRequest that started this log upload. This field is mandatory,
   * unless the message was triggered by a TriggerMessageRequest AND there is no log upload ongoing.
   *
   */
  requestId?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface LogStatusNotificationResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Sampled_ Value. Context. Reading_ Context_ Code
 * urn:x-oca:ocpp:uid:1:569261
 * Type of detail value: start, end or sample. Default = "Sample.Periodic"
 *
 */
export type ReadingContextEnumType =
  | "Interruption.Begin"
  | "Interruption.End"
  | "Other"
  | "Sample.Clock"
  | "Sample.Periodic"
  | "Transaction.Begin"
  | "Transaction.End"
  | "Trigger";
/**
 * Sampled_ Value. Measurand. Measurand_ Code
 * urn:x-oca:ocpp:uid:1:569263
 * Type of measurement. Default = "Energy.Active.Import.Register"
 *
 */
export type MeasurandEnumType =
  | "Current.Export"
  | "Current.Import"
  | "Current.Offered"
  | "Energy.Active.Export.Register"
  | "Energy.Active.Import.Register"
  | "Energy.Reactive.Export.Register"
  | "Energy.Reactive.Import.Register"
  | "Energy.Active.Export.Interval"
  | "Energy.Active.Import.Interval"
  | "Energy.Active.Net"
  | "Energy.Reactive.Export.Interval"
  | "Energy.Reactive.Import.Interval"
  | "Energy.Reactive.Net"
  | "Energy.Apparent.Net"
  | "Energy.Apparent.Import"
  | "Energy.Apparent.Export"
  | "Frequency"
  | "Power.Active.Export"
  | "Power.Active.Import"
  | "Power.Factor"
  | "Power.Offered"
  | "Power.Reactive.Export"
  | "Power.Reactive.Import"
  | "SoC"
  | "Voltage";
/**
 * Sampled_ Value. Phase. Phase_ Code
 * urn:x-oca:ocpp:uid:1:569264
 * Indicates how the measured value is to be interpreted. For instance between L1 and neutral (L1-N) Please note that not all values of phase are applicable to all Measurands. When phase is absent, the measured value is interpreted as an overall value.
 *
 */
export type PhaseEnumType = "L1" | "L2" | "L3" | "N" | "L1-N" | "L2-N" | "L3-N" | "L1-L2" | "L2-L3" | "L3-L1";
/**
 * Sampled_ Value. Location. Location_ Code
 * urn:x-oca:ocpp:uid:1:569265
 * Indicates where the measured value has been sampled. Default =  "Outlet"
 *
 *
 */
export type LocationEnumType = "Body" | "Cable" | "EV" | "Inlet" | "Outlet";

/**
 * Request_ Body
 * urn:x-enexis:ecdm:uid:2:234744
 *
 */
export interface MeterValuesRequest {
  customData?: CustomDataType;
  /**
   * Request_ Body. EVSEID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:571101
   * This contains a number (&gt;0) designating an EVSE of the Charging Station. ‘0’ (zero) is used to designate the main power meter.
   *
   */
  evseId: number;
  /**
   * @minItems 1
   */
  meterValue: MeterValueType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Meter_ Value
 * urn:x-oca:ocpp:uid:2:233265
 * Collection of one or more sampled values in MeterValuesRequest and TransactionEvent. All sampled values in a MeterValue are sampled at the same point in time.
 *
 */
export interface MeterValueType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  sampledValue: SampledValueType[];
  /**
   * Meter_ Value. Timestamp. Date_ Time
   * urn:x-oca:ocpp:uid:1:569259
   * Timestamp for measured value(s).
   *
   */
  timestamp: string;
}
/**
 * Sampled_ Value
 * urn:x-oca:ocpp:uid:2:233266
 * Single sampled value in MeterValues. Each value can be accompanied by optional fields.
 *
 * To save on mobile data usage, default values of all of the optional fields are such that. The value without any additional fields will be interpreted, as a register reading of active import energy in Wh (Watt-hour) units.
 *
 */
export interface SampledValueType {
  customData?: CustomDataType;
  /**
   * Sampled_ Value. Value. Measure
   * urn:x-oca:ocpp:uid:1:569260
   * Indicates the measured value.
   *
   *
   */
  value: number;
  context?: ReadingContextEnumType;
  measurand?: MeasurandEnumType;
  phase?: PhaseEnumType;
  location?: LocationEnumType;
  signedMeterValue?: SignedMeterValueType;
  unitOfMeasure?: UnitOfMeasureType;
}
/**
 * Represent a signed version of the meter value.
 *
 */
export interface SignedMeterValueType {
  customData?: CustomDataType;
  /**
   * Base64 encoded, contains the signed data which might contain more then just the meter value. It can contain information like timestamps, reference to a customer etc.
   *
   */
  signedMeterData: string;
  /**
   * Method used to create the digital signature.
   *
   */
  signingMethod: string;
  /**
   * Method used to encode the meter values before applying the digital signature algorithm.
   *
   */
  encodingMethod: string;
  /**
   * Base64 encoded, sending depends on configuration variable _PublicKeyWithSignedMeterValue_.
   *
   */
  publicKey: string;
}
/**
 * Represents a UnitOfMeasure with a multiplier
 *
 */
export interface UnitOfMeasureType {
  customData?: CustomDataType;
  /**
   * Unit of the value. Default = "Wh" if the (default) measurand is an "Energy" type.
   * This field SHALL use a value from the list Standardized Units of Measurements in Part 2 Appendices.
   * If an applicable unit is available in that list, otherwise a "custom" unit might be used.
   *
   */
  unit?: string;
  /**
   * Multiplier, this value represents the exponent to base 10. I.e. multiplier 3 means 10 raised to the 3rd power. Default is 0.
   *
   */
  multiplier?: number;
}

export interface MeterValuesResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Charging_ Schedule. Charging_ Rate_ Unit. Charging_ Rate_ Unit_ Code
 * urn:x-oca:ocpp:uid:1:569238
 * The unit of measure Limit is expressed in.
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";
/**
 * Cost. Cost_ Kind. Cost_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569243
 * The kind of cost referred to in the message element amount
 *
 */
export type CostKindEnumType = "CarbonDioxideEmission" | "RelativePricePercentage" | "RenewableGenerationPercentage";
/**
 * Charging_ Limit. Charging_ Limit_ Source. Charging_ Limit_ Source_ Code
 * urn:x-enexis:ecdm:uid:1:570845
 * Represents the source of the charging limit.
 *
 */
export type ChargingLimitSourceEnumType = "EMS" | "Other" | "SO" | "CSO";

export interface NotifyChargingLimitRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  chargingSchedule?: ChargingScheduleType[];
  /**
   * The charging schedule contained in this notification applies to an EVSE. evseId must be &gt; 0.
   *
   */
  evseId?: number;
  chargingLimit: ChargingLimitType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Schedule
 * urn:x-oca:ocpp:uid:2:233256
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 *
 */
export interface ChargingScheduleType {
  customData?: CustomDataType;
  /**
   * Identifies the ChargingSchedule.
   *
   */
  id: number;
  /**
   * Charging_ Schedule. Start_ Schedule. Date_ Time
   * urn:x-oca:ocpp:uid:1:569237
   * Starting point of an absolute schedule. If absent the schedule will be relative to start of charging.
   *
   */
  startSchedule?: string;
  /**
   * Charging_ Schedule. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569236
   * Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction if chargingProfilePurpose = TxProfile.
   *
   */
  duration?: number;
  chargingRateUnit: ChargingRateUnitEnumType;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
  /**
   * Charging_ Schedule. Min_ Charging_ Rate. Numeric
   * urn:x-oca:ocpp:uid:1:569239
   * Minimum charging rate supported by the EV. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1)
   *
   */
  minChargingRate?: number;
  salesTariff?: SalesTariffType;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number;
}
/**
 * Sales_ Tariff
 * urn:x-oca:ocpp:uid:2:233272
 * NOTE: This dataType is based on dataTypes from &lt;&lt;ref-ISOIEC15118-2,ISO 15118-2&gt;&gt;.
 *
 */
export interface SalesTariffType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * SalesTariff identifier used to identify one sales tariff. An SAID remains a unique identifier for one schedule throughout a charging session.
   *
   */
  id: number;
  /**
   * Sales_ Tariff. Sales. Tariff_ Description
   * urn:x-oca:ocpp:uid:1:569283
   * A human readable title/short description of the sales tariff e.g. for HMI display purposes.
   *
   */
  salesTariffDescription?: string;
  /**
   * Sales_ Tariff. Num_ E_ Price_ Levels. Counter
   * urn:x-oca:ocpp:uid:1:569284
   * Defines the overall number of distinct price levels used across all provided SalesTariff elements.
   *
   */
  numEPriceLevels?: number;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  salesTariffEntry: SalesTariffEntryType[];
}
/**
 * Sales_ Tariff_ Entry
 * urn:x-oca:ocpp:uid:2:233271
 *
 */
export interface SalesTariffEntryType {
  customData?: CustomDataType;
  relativeTimeInterval: RelativeTimeIntervalType;
  /**
   * Sales_ Tariff_ Entry. E_ Price_ Level. Unsigned_ Integer
   * urn:x-oca:ocpp:uid:1:569281
   * Defines the price level of this SalesTariffEntry (referring to NumEPriceLevels). Small values for the EPriceLevel represent a cheaper TariffEntry. Large values for the EPriceLevel represent a more expensive TariffEntry.
   *
   */
  ePriceLevel?: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  consumptionCost?: ConsumptionCostType[];
}
/**
 * Relative_ Timer_ Interval
 * urn:x-oca:ocpp:uid:2:233270
 *
 */
export interface RelativeTimeIntervalType {
  customData?: CustomDataType;
  /**
   * Relative_ Timer_ Interval. Start. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569279
   * Start of the interval, in seconds from NOW.
   *
   */
  start: number;
  /**
   * Relative_ Timer_ Interval. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569280
   * Duration of the interval, in seconds.
   *
   */
  duration?: number;
}
/**
 * Consumption_ Cost
 * urn:x-oca:ocpp:uid:2:233259
 *
 */
export interface ConsumptionCostType {
  customData?: CustomDataType;
  /**
   * Consumption_ Cost. Start_ Value. Numeric
   * urn:x-oca:ocpp:uid:1:569246
   * The lowest level of consumption that defines the starting point of this consumption block. The block interval extends to the start of the next interval.
   *
   */
  startValue: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  cost: CostType[];
}
/**
 * Cost
 * urn:x-oca:ocpp:uid:2:233258
 *
 */
export interface CostType {
  customData?: CustomDataType;
  costKind: CostKindEnumType;
  /**
   * Cost. Amount. Amount
   * urn:x-oca:ocpp:uid:1:569244
   * The estimated or actual cost per kWh
   *
   */
  amount: number;
  /**
   * Cost. Amount_ Multiplier. Integer
   * urn:x-oca:ocpp:uid:1:569245
   * Values: -3..3, The amountMultiplier defines the exponent to base 10 (dec). The final value is determined by: amount * 10 ^ amountMultiplier
   *
   */
  amountMultiplier?: number;
}
/**
 * Charging_ Limit
 * urn:x-enexis:ecdm:uid:2:234489
 *
 */
export interface ChargingLimitType {
  customData?: CustomDataType;
  chargingLimitSource: ChargingLimitSourceEnumType;
  /**
   * Charging_ Limit. Is_ Grid_ Critical. Indicator
   * urn:x-enexis:ecdm:uid:1:570847
   * Indicates whether the charging limit is critical for the grid.
   *
   */
  isGridCritical?: boolean;
}

export interface NotifyChargingLimitResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface NotifyCustomerInformationRequest {
  customData?: CustomDataType;
  /**
   * (Part of) the requested data. No format specified in which the data is returned. Should be human readable.
   *
   */
  data: string;
  /**
   * “to be continued” indicator. Indicates whether another part of the monitoringData follows in an upcoming notifyMonitoringReportRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
  /**
   *  Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
  /**
   * The Id of the request.
   *
   *
   */
  requestId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface NotifyCustomerInformationResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Message_ Info. Priority. Message_ Priority_ Code
 * urn:x-enexis:ecdm:uid:1:569253
 * With what priority should this message be shown
 *
 */
export type MessagePriorityEnumType = "AlwaysFront" | "InFront" | "NormalCycle";
/**
 * Message_ Info. State. Message_ State_ Code
 * urn:x-enexis:ecdm:uid:1:569254
 * During what state should this message be shown. When omitted this message should be shown in any state of the Charging Station.
 *
 */
export type MessageStateEnumType = "Charging" | "Faulted" | "Idle" | "Unavailable";
/**
 * Message_ Content. Format. Message_ Format_ Code
 * urn:x-enexis:ecdm:uid:1:570848
 * Format of the message.
 *
 */
export type MessageFormatEnumType = "ASCII" | "HTML" | "URI" | "UTF8";

export interface NotifyDisplayMessagesRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  messageInfo?: MessageInfoType[];
  /**
   * The id of the &lt;&lt;getdisplaymessagesrequest,GetDisplayMessagesRequest&gt;&gt; that requested this message.
   *
   */
  requestId: number;
  /**
   * "to be continued" indicator. Indicates whether another part of the report follows in an upcoming NotifyDisplayMessagesRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Message_ Info
 * urn:x-enexis:ecdm:uid:2:233264
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 */
export interface MessageInfoType {
  customData?: CustomDataType;
  display?: ComponentType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Master resource identifier, unique within an exchange context. It is defined within the OCPP context as a positive Integer value (greater or equal to zero).
   *
   */
  id: number;
  priority: MessagePriorityEnumType;
  state?: MessageStateEnumType;
  /**
   * Message_ Info. Start. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569256
   * From what date-time should this message be shown. If omitted: directly.
   *
   */
  startDateTime?: string;
  /**
   * Message_ Info. End. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569257
   * Until what date-time should this message be shown, after this date/time this message SHALL be removed.
   *
   */
  endDateTime?: string;
  /**
   * During which transaction shall this message be shown.
   * Message SHALL be removed by the Charging Station after transaction has
   * ended.
   *
   */
  transactionId?: string;
  message: MessageContentType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Message_ Content
 * urn:x-enexis:ecdm:uid:2:234490
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 *
 */
export interface MessageContentType {
  customData?: CustomDataType;
  format: MessageFormatEnumType;
  /**
   * Message_ Content. Language. Language_ Code
   * urn:x-enexis:ecdm:uid:1:570849
   * Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language?: string;
  /**
   * Message_ Content. Content. Message
   * urn:x-enexis:ecdm:uid:1:570852
   * Message contents.
   *
   *
   */
  content: string;
}

export interface NotifyDisplayMessagesResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Charging_ Needs. Requested. Energy_ Transfer_ Mode_ Code
 * urn:x-oca:ocpp:uid:1:569209
 * Mode of energy transfer requested by the EV.
 *
 */
export type EnergyTransferModeEnumType = "DC" | "AC_single_phase" | "AC_two_phase" | "AC_three_phase";

export interface NotifyEVChargingNeedsRequest {
  customData?: CustomDataType;
  /**
   * Contains the maximum schedule tuples the car supports per schedule.
   *
   */
  maxScheduleTuples?: number;
  chargingNeeds: ChargingNeedsType;
  /**
   * Defines the EVSE and connector to which the EV is connected. EvseId may not be 0.
   *
   */
  evseId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Needs
 * urn:x-oca:ocpp:uid:2:233249
 *
 */
export interface ChargingNeedsType {
  customData?: CustomDataType;
  acChargingParameters?: ACChargingParametersType;
  dcChargingParameters?: DCChargingParametersType;
  requestedEnergyTransfer: EnergyTransferModeEnumType;
  /**
   * Charging_ Needs. Departure_ Time. Date_ Time
   * urn:x-oca:ocpp:uid:1:569223
   * Estimated departure time of the EV.
   *
   */
  departureTime?: string;
}
/**
 * AC_ Charging_ Parameters
 * urn:x-oca:ocpp:uid:2:233250
 * EV AC charging parameters.
 *
 *
 */
export interface ACChargingParametersType {
  customData?: CustomDataType;
  /**
   * AC_ Charging_ Parameters. Energy_ Amount. Energy_ Amount
   * urn:x-oca:ocpp:uid:1:569211
   * Amount of energy requested (in Wh). This includes energy required for preconditioning.
   *
   */
  energyAmount: number;
  /**
   * AC_ Charging_ Parameters. EV_ Min. Current
   * urn:x-oca:ocpp:uid:1:569212
   * Minimum current (amps) supported by the electric vehicle (per phase).
   *
   */
  evMinCurrent: number;
  /**
   * AC_ Charging_ Parameters. EV_ Max. Current
   * urn:x-oca:ocpp:uid:1:569213
   * Maximum current (amps) supported by the electric vehicle (per phase). Includes cable capacity.
   *
   */
  evMaxCurrent: number;
  /**
   * AC_ Charging_ Parameters. EV_ Max. Voltage
   * urn:x-oca:ocpp:uid:1:569214
   * Maximum voltage supported by the electric vehicle
   *
   */
  evMaxVoltage: number;
}
/**
 * DC_ Charging_ Parameters
 * urn:x-oca:ocpp:uid:2:233251
 * EV DC charging parameters
 *
 *
 *
 */
export interface DCChargingParametersType {
  customData?: CustomDataType;
  /**
   * DC_ Charging_ Parameters. EV_ Max. Current
   * urn:x-oca:ocpp:uid:1:569215
   * Maximum current (amps) supported by the electric vehicle. Includes cable capacity.
   *
   */
  evMaxCurrent: number;
  /**
   * DC_ Charging_ Parameters. EV_ Max. Voltage
   * urn:x-oca:ocpp:uid:1:569216
   * Maximum voltage supported by the electric vehicle
   *
   */
  evMaxVoltage: number;
  /**
   * DC_ Charging_ Parameters. Energy_ Amount. Energy_ Amount
   * urn:x-oca:ocpp:uid:1:569217
   * Amount of energy requested (in Wh). This inludes energy required for preconditioning.
   *
   */
  energyAmount?: number;
  /**
   * DC_ Charging_ Parameters. EV_ Max. Power
   * urn:x-oca:ocpp:uid:1:569218
   * Maximum power (in W) supported by the electric vehicle. Required for DC charging.
   *
   */
  evMaxPower?: number;
  /**
   * DC_ Charging_ Parameters. State_ Of_ Charge. Numeric
   * urn:x-oca:ocpp:uid:1:569219
   * Energy available in the battery (in percent of the battery capacity)
   *
   */
  stateOfCharge?: number;
  /**
   * DC_ Charging_ Parameters. EV_ Energy_ Capacity. Numeric
   * urn:x-oca:ocpp:uid:1:569220
   * Capacity of the electric vehicle battery (in Wh)
   *
   */
  evEnergyCapacity?: number;
  /**
   * DC_ Charging_ Parameters. Full_ SOC. Percentage
   * urn:x-oca:ocpp:uid:1:569221
   * Percentage of SoC at which the EV considers the battery fully charged. (possible values: 0 - 100)
   *
   */
  fullSoC?: number;
  /**
   * DC_ Charging_ Parameters. Bulk_ SOC. Percentage
   * urn:x-oca:ocpp:uid:1:569222
   * Percentage of SoC at which the EV considers a fast charging process to end. (possible values: 0 - 100)
   *
   */
  bulkSoC?: number;
}

/**
 * Returns whether the CSMS has been able to process the message successfully. It does not imply that the evChargingNeeds can be met with the current charging profile.
 *
 */
export type NotifyEVChargingNeedsStatusEnumType = "Accepted" | "Rejected" | "Processing";

export interface NotifyEVChargingNeedsResponse {
  customData?: CustomDataType;
  status: NotifyEVChargingNeedsStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Charging_ Schedule. Charging_ Rate_ Unit. Charging_ Rate_ Unit_ Code
 * urn:x-oca:ocpp:uid:1:569238
 * The unit of measure Limit is expressed in.
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";
/**
 * Cost. Cost_ Kind. Cost_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569243
 * The kind of cost referred to in the message element amount
 *
 */
export type CostKindEnumType = "CarbonDioxideEmission" | "RelativePricePercentage" | "RenewableGenerationPercentage";

export interface NotifyEVChargingScheduleRequest {
  customData?: CustomDataType;
  /**
   * Periods contained in the charging profile are relative to this point in time.
   *
   */
  timeBase: string;
  chargingSchedule: ChargingScheduleType;
  /**
   * The charging schedule contained in this notification applies to an EVSE. EvseId must be &gt; 0.
   *
   */
  evseId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Schedule
 * urn:x-oca:ocpp:uid:2:233256
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 *
 */
export interface ChargingScheduleType {
  customData?: CustomDataType;
  /**
   * Identifies the ChargingSchedule.
   *
   */
  id: number;
  /**
   * Charging_ Schedule. Start_ Schedule. Date_ Time
   * urn:x-oca:ocpp:uid:1:569237
   * Starting point of an absolute schedule. If absent the schedule will be relative to start of charging.
   *
   */
  startSchedule?: string;
  /**
   * Charging_ Schedule. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569236
   * Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction if chargingProfilePurpose = TxProfile.
   *
   */
  duration?: number;
  chargingRateUnit: ChargingRateUnitEnumType;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
  /**
   * Charging_ Schedule. Min_ Charging_ Rate. Numeric
   * urn:x-oca:ocpp:uid:1:569239
   * Minimum charging rate supported by the EV. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1)
   *
   */
  minChargingRate?: number;
  salesTariff?: SalesTariffType;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number;
}
/**
 * Sales_ Tariff
 * urn:x-oca:ocpp:uid:2:233272
 * NOTE: This dataType is based on dataTypes from &lt;&lt;ref-ISOIEC15118-2,ISO 15118-2&gt;&gt;.
 *
 */
export interface SalesTariffType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * SalesTariff identifier used to identify one sales tariff. An SAID remains a unique identifier for one schedule throughout a charging session.
   *
   */
  id: number;
  /**
   * Sales_ Tariff. Sales. Tariff_ Description
   * urn:x-oca:ocpp:uid:1:569283
   * A human readable title/short description of the sales tariff e.g. for HMI display purposes.
   *
   */
  salesTariffDescription?: string;
  /**
   * Sales_ Tariff. Num_ E_ Price_ Levels. Counter
   * urn:x-oca:ocpp:uid:1:569284
   * Defines the overall number of distinct price levels used across all provided SalesTariff elements.
   *
   */
  numEPriceLevels?: number;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  salesTariffEntry: SalesTariffEntryType[];
}
/**
 * Sales_ Tariff_ Entry
 * urn:x-oca:ocpp:uid:2:233271
 *
 */
export interface SalesTariffEntryType {
  customData?: CustomDataType;
  relativeTimeInterval: RelativeTimeIntervalType;
  /**
   * Sales_ Tariff_ Entry. E_ Price_ Level. Unsigned_ Integer
   * urn:x-oca:ocpp:uid:1:569281
   * Defines the price level of this SalesTariffEntry (referring to NumEPriceLevels). Small values for the EPriceLevel represent a cheaper TariffEntry. Large values for the EPriceLevel represent a more expensive TariffEntry.
   *
   */
  ePriceLevel?: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  consumptionCost?: ConsumptionCostType[];
}
/**
 * Relative_ Timer_ Interval
 * urn:x-oca:ocpp:uid:2:233270
 *
 */
export interface RelativeTimeIntervalType {
  customData?: CustomDataType;
  /**
   * Relative_ Timer_ Interval. Start. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569279
   * Start of the interval, in seconds from NOW.
   *
   */
  start: number;
  /**
   * Relative_ Timer_ Interval. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569280
   * Duration of the interval, in seconds.
   *
   */
  duration?: number;
}
/**
 * Consumption_ Cost
 * urn:x-oca:ocpp:uid:2:233259
 *
 */
export interface ConsumptionCostType {
  customData?: CustomDataType;
  /**
   * Consumption_ Cost. Start_ Value. Numeric
   * urn:x-oca:ocpp:uid:1:569246
   * The lowest level of consumption that defines the starting point of this consumption block. The block interval extends to the start of the next interval.
   *
   */
  startValue: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  cost: CostType[];
}
/**
 * Cost
 * urn:x-oca:ocpp:uid:2:233258
 *
 */
export interface CostType {
  customData?: CustomDataType;
  costKind: CostKindEnumType;
  /**
   * Cost. Amount. Amount
   * urn:x-oca:ocpp:uid:1:569244
   * The estimated or actual cost per kWh
   *
   */
  amount: number;
  /**
   * Cost. Amount_ Multiplier. Integer
   * urn:x-oca:ocpp:uid:1:569245
   * Values: -3..3, The amountMultiplier defines the exponent to base 10 (dec). The final value is determined by: amount * 10 ^ amountMultiplier
   *
   */
  amountMultiplier?: number;
}

/**
 * Returns whether the CSMS has been able to process the message successfully. It does not imply any approval of the charging schedule.
 *
 */
export type GenericStatusEnumType = "Accepted" | "Rejected";

export interface NotifyEVChargingScheduleResponse {
  customData?: CustomDataType;
  status: GenericStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Type of monitor that triggered this event, e.g. exceeding a threshold value.
 *
 *
 */
export type EventTriggerEnumType = "Alerting" | "Delta" | "Periodic";
/**
 * Specifies the event notification type of the message.
 *
 *
 */
export type EventNotificationEnumType =
  | "HardWiredNotification"
  | "HardWiredMonitor"
  | "PreconfiguredMonitor"
  | "CustomMonitor";

export interface NotifyEventRequest {
  customData?: CustomDataType;
  /**
   * Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
  /**
   * “to be continued” indicator. Indicates whether another part of the report follows in an upcoming notifyEventRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
  /**
   * @minItems 1
   */
  eventData: EventDataType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to report an event notification for a component-variable.
 *
 */
export interface EventDataType {
  customData?: CustomDataType;
  /**
   * Identifies the event. This field can be referred to as a cause by other events.
   *
   *
   */
  eventId: number;
  /**
   * Timestamp of the moment the report was generated.
   *
   */
  timestamp: string;
  trigger: EventTriggerEnumType;
  /**
   * Refers to the Id of an event that is considered to be the cause for this event.
   *
   *
   */
  cause?: number;
  /**
   * Actual value (_attributeType_ Actual) of the variable.
   *
   * The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal.
   *
   *
   */
  actualValue: string;
  /**
   * Technical (error) code as reported by component.
   *
   */
  techCode?: string;
  /**
   * Technical detail information as reported by component.
   *
   */
  techInfo?: string;
  /**
   * _Cleared_ is set to true to report the clearing of a monitored situation, i.e. a 'return to normal'.
   *
   *
   */
  cleared?: boolean;
  /**
   * If an event notification is linked to a specific transaction, this field can be used to specify its transactionId.
   *
   */
  transactionId?: string;
  component: ComponentType;
  /**
   * Identifies the VariableMonitoring which triggered the event.
   *
   */
  variableMonitoringId?: number;
  eventNotificationType: EventNotificationEnumType;
  variable: VariableType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

export interface NotifyEventResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * The type of this monitor, e.g. a threshold, delta or periodic monitor.
 *
 */
export type MonitorEnumType = "UpperThreshold" | "LowerThreshold" | "Delta" | "Periodic" | "PeriodicClockAligned";

export interface NotifyMonitoringReportRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  monitor?: MonitoringDataType[];
  /**
   * The id of the GetMonitoringRequest that requested this report.
   *
   *
   */
  requestId: number;
  /**
   * “to be continued” indicator. Indicates whether another part of the monitoringData follows in an upcoming notifyMonitoringReportRequest message. Default value when omitted is false.
   *
   */
  tbc?: boolean;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
  /**
   * Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to hold parameters of SetVariableMonitoring request.
 *
 */
export interface MonitoringDataType {
  customData?: CustomDataType;
  component: ComponentType;
  variable: VariableType;
  /**
   * @minItems 1
   */
  variableMonitoring: VariableMonitoringType[];
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * A monitoring setting for a variable.
 *
 */
export interface VariableMonitoringType {
  customData?: CustomDataType;
  /**
   * Identifies the monitor.
   *
   */
  id: number;
  /**
   * Monitor only active when a transaction is ongoing on a component relevant to this transaction.
   *
   */
  transaction: boolean;
  /**
   * Value for threshold or delta monitoring.
   * For Periodic or PeriodicClockAligned this is the interval in seconds.
   *
   */
  value: number;
  type: MonitorEnumType;
  /**
   * The severity that will be assigned to an event that is triggered by this monitor. The severity range is 0-9, with 0 as the highest and 9 as the lowest severity level.
   *
   * The severity levels have the following meaning: +
   * *0-Danger* +
   * Indicates lives are potentially in danger. Urgent attention is needed and action should be taken immediately. +
   * *1-Hardware Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to Hardware issues. Action is required. +
   * *2-System Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to software or minor hardware issues. Action is required. +
   * *3-Critical* +
   * Indicates a critical error. Action is required. +
   * *4-Error* +
   * Indicates a non-urgent error. Action is required. +
   * *5-Alert* +
   * Indicates an alert event. Default severity for any type of monitoring event.  +
   * *6-Warning* +
   * Indicates a warning event. Action may be required. +
   * *7-Notice* +
   * Indicates an unusual event. No immediate action is required. +
   * *8-Informational* +
   * Indicates a regular operational event. May be used for reporting, measuring throughput, etc. No action is required. +
   * *9-Debug* +
   * Indicates information useful to developers for debugging, not useful during operations.
   *
   */
  severity: number;
}

export interface NotifyMonitoringReportResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Attribute: Actual, MinSet, MaxSet, etc.
 * Defaults to Actual if absent.
 *
 */
export type AttributeEnumType = "Actual" | "Target" | "MinSet" | "MaxSet";
/**
 * Defines the mutability of this attribute. Default is ReadWrite when omitted.
 *
 */
export type MutabilityEnumType = "ReadOnly" | "WriteOnly" | "ReadWrite";
/**
 * Data type of this variable.
 *
 */
export type DataEnumType =
  | "string"
  | "decimal"
  | "integer"
  | "dateTime"
  | "boolean"
  | "OptionList"
  | "SequenceList"
  | "MemberList";

export interface NotifyReportRequest {
  customData?: CustomDataType;
  /**
   * The id of the GetReportRequest  or GetBaseReportRequest that requested this report
   *
   */
  requestId: number;
  /**
   * Timestamp of the moment this message was generated at the Charging Station.
   *
   */
  generatedAt: string;
  /**
   * @minItems 1
   */
  reportData?: ReportDataType[];
  /**
   * “to be continued” indicator. Indicates whether another part of the report follows in an upcoming notifyReportRequest message. Default value when omitted is false.
   *
   *
   */
  tbc?: boolean;
  /**
   * Sequence number of this message. First message starts at 0.
   *
   */
  seqNo: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to report components, variables and variable attributes and characteristics.
 *
 */
export interface ReportDataType {
  customData?: CustomDataType;
  component: ComponentType;
  variable: VariableType;
  /**
   * @minItems 1
   * @maxItems 4
   */
  variableAttribute: VariableAttributeType[];
  variableCharacteristics?: VariableCharacteristicsType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * Attribute data of a variable.
 *
 */
export interface VariableAttributeType {
  customData?: CustomDataType;
  type?: AttributeEnumType;
  /**
   * Value of the attribute. May only be omitted when mutability is set to 'WriteOnly'.
   *
   * The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal.
   *
   */
  value?: string;
  mutability?: MutabilityEnumType;
  /**
   * If true, value will be persistent across system reboots or power down. Default when omitted is false.
   *
   */
  persistent?: boolean;
  /**
   * If true, value that will never be changed by the Charging Station at runtime. Default when omitted is false.
   *
   */
  constant?: boolean;
}
/**
 * Fixed read-only parameters of a variable.
 *
 */
export interface VariableCharacteristicsType {
  customData?: CustomDataType;
  /**
   * Unit of the variable. When the transmitted value has a unit, this field SHALL be included.
   *
   */
  unit?: string;
  dataType: DataEnumType;
  /**
   * Minimum possible value of this variable.
   *
   */
  minLimit?: number;
  /**
   * Maximum possible value of this variable. When the datatype of this Variable is String, OptionList, SequenceList or MemberList, this field defines the maximum length of the (CSV) string.
   *
   */
  maxLimit?: number;
  /**
   * Allowed values when variable is Option/Member/SequenceList.
   *
   * * OptionList: The (Actual) Variable value must be a single value from the reported (CSV) enumeration list.
   *
   * * MemberList: The (Actual) Variable value  may be an (unordered) (sub-)set of the reported (CSV) valid values list.
   *
   * * SequenceList: The (Actual) Variable value  may be an ordered (priority, etc)  (sub-)set of the reported (CSV) valid values.
   *
   * This is a comma separated list.
   *
   * The Configuration Variable &lt;&lt;configkey-configuration-value-size,ConfigurationValueSize&gt;&gt; can be used to limit SetVariableData.attributeValue and VariableCharacteristics.valueList. The max size of these values will always remain equal.
   *
   *
   */
  valuesList?: string;
  /**
   * Flag indicating if this variable supports monitoring.
   *
   */
  supportsMonitoring: boolean;
}

export interface NotifyReportResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface PublishFirmwareRequest {
  customData?: CustomDataType;
  /**
   * This contains a string containing a URI pointing to a
   * location from which to retrieve the firmware.
   *
   */
  location: string;
  /**
   * This specifies how many times Charging Station must try
   * to download the firmware before giving up. If this field is not
   * present, it is left to Charging Station to decide how many times it wants to retry.
   *
   */
  retries?: number;
  /**
   * The MD5 checksum over the entire firmware file as a hexadecimal string of length 32.
   *
   */
  checksum: string;
  /**
   * The Id of the request.
   *
   */
  requestId: number;
  /**
   * The interval in seconds
   * after which a retry may be
   * attempted. If this field is not
   * present, it is left to Charging
   * Station to decide how long to wait
   * between attempts.
   *
   */
  retryInterval?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates whether the request was accepted.
 *
 */
export type GenericStatusEnumType = "Accepted" | "Rejected";

export interface PublishFirmwareResponse {
  customData?: CustomDataType;
  status: GenericStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This contains the progress status of the publishfirmware
 * installation.
 *
 */
export type PublishFirmwareStatusEnumType =
  | "Idle"
  | "DownloadScheduled"
  | "Downloading"
  | "Downloaded"
  | "Published"
  | "DownloadFailed"
  | "DownloadPaused"
  | "InvalidChecksum"
  | "ChecksumVerified"
  | "PublishFailed";

export interface PublishFirmwareStatusNotificationRequest {
  customData?: CustomDataType;
  status: PublishFirmwareStatusEnumType;
  /**
   * Required if status is Published. Can be multiple URI’s, if the Local Controller supports e.g. HTTP, HTTPS, and FTP.
   *
   *
   * @minItems 1
   */
  location?: string[];
  /**
   * The request id that was
   * provided in the
   * PublishFirmwareRequest which
   * triggered this action.
   *
   */
  requestId?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface PublishFirmwareStatusNotificationResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Source that has installed this charging profile.
 *
 */
export type ChargingLimitSourceEnumType = "EMS" | "Other" | "SO" | "CSO";
/**
 * Charging_ Profile. Charging_ Profile_ Purpose. Charging_ Profile_ Purpose_ Code
 * urn:x-oca:ocpp:uid:1:569231
 * Defines the purpose of the schedule transferred by this profile
 *
 */
export type ChargingProfilePurposeEnumType =
  | "ChargingStationExternalConstraints"
  | "ChargingStationMaxProfile"
  | "TxDefaultProfile"
  | "TxProfile";
/**
 * Charging_ Profile. Charging_ Profile_ Kind. Charging_ Profile_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569232
 * Indicates the kind of schedule.
 *
 */
export type ChargingProfileKindEnumType = "Absolute" | "Recurring" | "Relative";
/**
 * Charging_ Profile. Recurrency_ Kind. Recurrency_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569233
 * Indicates the start point of a recurrence.
 *
 */
export type RecurrencyKindEnumType = "Daily" | "Weekly";
/**
 * Charging_ Schedule. Charging_ Rate_ Unit. Charging_ Rate_ Unit_ Code
 * urn:x-oca:ocpp:uid:1:569238
 * The unit of measure Limit is expressed in.
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";
/**
 * Cost. Cost_ Kind. Cost_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569243
 * The kind of cost referred to in the message element amount
 *
 */
export type CostKindEnumType = "CarbonDioxideEmission" | "RelativePricePercentage" | "RenewableGenerationPercentage";

export interface ReportChargingProfilesRequest {
  customData?: CustomDataType;
  /**
   * Id used to match the &lt;&lt;getchargingprofilesrequest, GetChargingProfilesRequest&gt;&gt; message with the resulting ReportChargingProfilesRequest messages. When the CSMS provided a requestId in the &lt;&lt;getchargingprofilesrequest, GetChargingProfilesRequest&gt;&gt;, this field SHALL contain the same value.
   *
   */
  requestId: number;
  chargingLimitSource: ChargingLimitSourceEnumType;
  /**
   * @minItems 1
   */
  chargingProfile: ChargingProfileType[];
  /**
   * To Be Continued. Default value when omitted: false. false indicates that there are no further messages as part of this report.
   *
   */
  tbc?: boolean;
  /**
   * The evse to which the charging profile applies. If evseId = 0, the message contains an overall limit for the Charging Station.
   *
   */
  evseId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ChargingProfileType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Id of ChargingProfile.
   *
   */
  id: number;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0.
   *
   */
  stackLevel: number;
  chargingProfilePurpose: ChargingProfilePurposeEnumType;
  chargingProfileKind: ChargingProfileKindEnumType;
  recurrencyKind?: RecurrencyKindEnumType;
  /**
   * Charging_ Profile. Valid_ From. Date_ Time
   * urn:x-oca:ocpp:uid:1:569234
   * Point in time at which the profile starts to be valid. If absent, the profile is valid as soon as it is received by the Charging Station.
   *
   */
  validFrom?: string;
  /**
   * Charging_ Profile. Valid_ To. Date_ Time
   * urn:x-oca:ocpp:uid:1:569235
   * Point in time at which the profile stops to be valid. If absent, the profile is valid until it is replaced by another profile.
   *
   */
  validTo?: string;
  /**
   * @minItems 1
   * @maxItems 3
   */
  chargingSchedule: ChargingScheduleType[];
  /**
   * SHALL only be included if ChargingProfilePurpose is set to TxProfile. The transactionId is used to match the profile to a specific transaction.
   *
   */
  transactionId?: string;
}
/**
 * Charging_ Schedule
 * urn:x-oca:ocpp:uid:2:233256
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 *
 */
export interface ChargingScheduleType {
  customData?: CustomDataType;
  /**
   * Identifies the ChargingSchedule.
   *
   */
  id: number;
  /**
   * Charging_ Schedule. Start_ Schedule. Date_ Time
   * urn:x-oca:ocpp:uid:1:569237
   * Starting point of an absolute schedule. If absent the schedule will be relative to start of charging.
   *
   */
  startSchedule?: string;
  /**
   * Charging_ Schedule. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569236
   * Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction if chargingProfilePurpose = TxProfile.
   *
   */
  duration?: number;
  chargingRateUnit: ChargingRateUnitEnumType;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
  /**
   * Charging_ Schedule. Min_ Charging_ Rate. Numeric
   * urn:x-oca:ocpp:uid:1:569239
   * Minimum charging rate supported by the EV. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1)
   *
   */
  minChargingRate?: number;
  salesTariff?: SalesTariffType;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number;
}
/**
 * Sales_ Tariff
 * urn:x-oca:ocpp:uid:2:233272
 * NOTE: This dataType is based on dataTypes from &lt;&lt;ref-ISOIEC15118-2,ISO 15118-2&gt;&gt;.
 *
 */
export interface SalesTariffType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * SalesTariff identifier used to identify one sales tariff. An SAID remains a unique identifier for one schedule throughout a charging session.
   *
   */
  id: number;
  /**
   * Sales_ Tariff. Sales. Tariff_ Description
   * urn:x-oca:ocpp:uid:1:569283
   * A human readable title/short description of the sales tariff e.g. for HMI display purposes.
   *
   */
  salesTariffDescription?: string;
  /**
   * Sales_ Tariff. Num_ E_ Price_ Levels. Counter
   * urn:x-oca:ocpp:uid:1:569284
   * Defines the overall number of distinct price levels used across all provided SalesTariff elements.
   *
   */
  numEPriceLevels?: number;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  salesTariffEntry: SalesTariffEntryType[];
}
/**
 * Sales_ Tariff_ Entry
 * urn:x-oca:ocpp:uid:2:233271
 *
 */
export interface SalesTariffEntryType {
  customData?: CustomDataType;
  relativeTimeInterval: RelativeTimeIntervalType;
  /**
   * Sales_ Tariff_ Entry. E_ Price_ Level. Unsigned_ Integer
   * urn:x-oca:ocpp:uid:1:569281
   * Defines the price level of this SalesTariffEntry (referring to NumEPriceLevels). Small values for the EPriceLevel represent a cheaper TariffEntry. Large values for the EPriceLevel represent a more expensive TariffEntry.
   *
   */
  ePriceLevel?: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  consumptionCost?: ConsumptionCostType[];
}
/**
 * Relative_ Timer_ Interval
 * urn:x-oca:ocpp:uid:2:233270
 *
 */
export interface RelativeTimeIntervalType {
  customData?: CustomDataType;
  /**
   * Relative_ Timer_ Interval. Start. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569279
   * Start of the interval, in seconds from NOW.
   *
   */
  start: number;
  /**
   * Relative_ Timer_ Interval. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569280
   * Duration of the interval, in seconds.
   *
   */
  duration?: number;
}
/**
 * Consumption_ Cost
 * urn:x-oca:ocpp:uid:2:233259
 *
 */
export interface ConsumptionCostType {
  customData?: CustomDataType;
  /**
   * Consumption_ Cost. Start_ Value. Numeric
   * urn:x-oca:ocpp:uid:1:569246
   * The lowest level of consumption that defines the starting point of this consumption block. The block interval extends to the start of the next interval.
   *
   */
  startValue: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  cost: CostType[];
}
/**
 * Cost
 * urn:x-oca:ocpp:uid:2:233258
 *
 */
export interface CostType {
  customData?: CustomDataType;
  costKind: CostKindEnumType;
  /**
   * Cost. Amount. Amount
   * urn:x-oca:ocpp:uid:1:569244
   * The estimated or actual cost per kWh
   *
   */
  amount: number;
  /**
   * Cost. Amount_ Multiplier. Integer
   * urn:x-oca:ocpp:uid:1:569245
   * Values: -3..3, The amountMultiplier defines the exponent to base 10 (dec). The final value is determined by: amount * 10 ^ amountMultiplier
   *
   */
  amountMultiplier?: number;
}

export interface ReportChargingProfilesResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";
/**
 * Charging_ Profile. Charging_ Profile_ Purpose. Charging_ Profile_ Purpose_ Code
 * urn:x-oca:ocpp:uid:1:569231
 * Defines the purpose of the schedule transferred by this profile
 *
 */
export type ChargingProfilePurposeEnumType =
  | "ChargingStationExternalConstraints"
  | "ChargingStationMaxProfile"
  | "TxDefaultProfile"
  | "TxProfile";
/**
 * Charging_ Profile. Charging_ Profile_ Kind. Charging_ Profile_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569232
 * Indicates the kind of schedule.
 *
 */
export type ChargingProfileKindEnumType = "Absolute" | "Recurring" | "Relative";
/**
 * Charging_ Profile. Recurrency_ Kind. Recurrency_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569233
 * Indicates the start point of a recurrence.
 *
 */
export type RecurrencyKindEnumType = "Daily" | "Weekly";
/**
 * Charging_ Schedule. Charging_ Rate_ Unit. Charging_ Rate_ Unit_ Code
 * urn:x-oca:ocpp:uid:1:569238
 * The unit of measure Limit is expressed in.
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";
/**
 * Cost. Cost_ Kind. Cost_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569243
 * The kind of cost referred to in the message element amount
 *
 */
export type CostKindEnumType = "CarbonDioxideEmission" | "RelativePricePercentage" | "RenewableGenerationPercentage";

export interface RequestStartTransactionRequest {
  customData?: CustomDataType;
  /**
   * Number of the EVSE on which to start the transaction. EvseId SHALL be &gt; 0
   *
   */
  evseId?: number;
  groupIdToken?: IdTokenType;
  idToken: IdTokenType;
  /**
   * Id given by the server to this start request. The Charging Station might return this in the &lt;&lt;transactioneventrequest, TransactionEventRequest&gt;&gt;, letting the server know which transaction was started for this request. Use to start a transaction.
   *
   */
  remoteStartId: number;
  chargingProfile?: ChargingProfileType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ChargingProfileType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Id of ChargingProfile.
   *
   */
  id: number;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0.
   *
   */
  stackLevel: number;
  chargingProfilePurpose: ChargingProfilePurposeEnumType;
  chargingProfileKind: ChargingProfileKindEnumType;
  recurrencyKind?: RecurrencyKindEnumType;
  /**
   * Charging_ Profile. Valid_ From. Date_ Time
   * urn:x-oca:ocpp:uid:1:569234
   * Point in time at which the profile starts to be valid. If absent, the profile is valid as soon as it is received by the Charging Station.
   *
   */
  validFrom?: string;
  /**
   * Charging_ Profile. Valid_ To. Date_ Time
   * urn:x-oca:ocpp:uid:1:569235
   * Point in time at which the profile stops to be valid. If absent, the profile is valid until it is replaced by another profile.
   *
   */
  validTo?: string;
  /**
   * @minItems 1
   * @maxItems 3
   */
  chargingSchedule: ChargingScheduleType[];
  /**
   * SHALL only be included if ChargingProfilePurpose is set to TxProfile. The transactionId is used to match the profile to a specific transaction.
   *
   */
  transactionId?: string;
}
/**
 * Charging_ Schedule
 * urn:x-oca:ocpp:uid:2:233256
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 *
 */
export interface ChargingScheduleType {
  customData?: CustomDataType;
  /**
   * Identifies the ChargingSchedule.
   *
   */
  id: number;
  /**
   * Charging_ Schedule. Start_ Schedule. Date_ Time
   * urn:x-oca:ocpp:uid:1:569237
   * Starting point of an absolute schedule. If absent the schedule will be relative to start of charging.
   *
   */
  startSchedule?: string;
  /**
   * Charging_ Schedule. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569236
   * Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction if chargingProfilePurpose = TxProfile.
   *
   */
  duration?: number;
  chargingRateUnit: ChargingRateUnitEnumType;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
  /**
   * Charging_ Schedule. Min_ Charging_ Rate. Numeric
   * urn:x-oca:ocpp:uid:1:569239
   * Minimum charging rate supported by the EV. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1)
   *
   */
  minChargingRate?: number;
  salesTariff?: SalesTariffType;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number;
}
/**
 * Sales_ Tariff
 * urn:x-oca:ocpp:uid:2:233272
 * NOTE: This dataType is based on dataTypes from &lt;&lt;ref-ISOIEC15118-2,ISO 15118-2&gt;&gt;.
 *
 */
export interface SalesTariffType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * SalesTariff identifier used to identify one sales tariff. An SAID remains a unique identifier for one schedule throughout a charging session.
   *
   */
  id: number;
  /**
   * Sales_ Tariff. Sales. Tariff_ Description
   * urn:x-oca:ocpp:uid:1:569283
   * A human readable title/short description of the sales tariff e.g. for HMI display purposes.
   *
   */
  salesTariffDescription?: string;
  /**
   * Sales_ Tariff. Num_ E_ Price_ Levels. Counter
   * urn:x-oca:ocpp:uid:1:569284
   * Defines the overall number of distinct price levels used across all provided SalesTariff elements.
   *
   */
  numEPriceLevels?: number;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  salesTariffEntry: SalesTariffEntryType[];
}
/**
 * Sales_ Tariff_ Entry
 * urn:x-oca:ocpp:uid:2:233271
 *
 */
export interface SalesTariffEntryType {
  customData?: CustomDataType;
  relativeTimeInterval: RelativeTimeIntervalType;
  /**
   * Sales_ Tariff_ Entry. E_ Price_ Level. Unsigned_ Integer
   * urn:x-oca:ocpp:uid:1:569281
   * Defines the price level of this SalesTariffEntry (referring to NumEPriceLevels). Small values for the EPriceLevel represent a cheaper TariffEntry. Large values for the EPriceLevel represent a more expensive TariffEntry.
   *
   */
  ePriceLevel?: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  consumptionCost?: ConsumptionCostType[];
}
/**
 * Relative_ Timer_ Interval
 * urn:x-oca:ocpp:uid:2:233270
 *
 */
export interface RelativeTimeIntervalType {
  customData?: CustomDataType;
  /**
   * Relative_ Timer_ Interval. Start. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569279
   * Start of the interval, in seconds from NOW.
   *
   */
  start: number;
  /**
   * Relative_ Timer_ Interval. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569280
   * Duration of the interval, in seconds.
   *
   */
  duration?: number;
}
/**
 * Consumption_ Cost
 * urn:x-oca:ocpp:uid:2:233259
 *
 */
export interface ConsumptionCostType {
  customData?: CustomDataType;
  /**
   * Consumption_ Cost. Start_ Value. Numeric
   * urn:x-oca:ocpp:uid:1:569246
   * The lowest level of consumption that defines the starting point of this consumption block. The block interval extends to the start of the next interval.
   *
   */
  startValue: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  cost: CostType[];
}
/**
 * Cost
 * urn:x-oca:ocpp:uid:2:233258
 *
 */
export interface CostType {
  customData?: CustomDataType;
  costKind: CostKindEnumType;
  /**
   * Cost. Amount. Amount
   * urn:x-oca:ocpp:uid:1:569244
   * The estimated or actual cost per kWh
   *
   */
  amount: number;
  /**
   * Cost. Amount_ Multiplier. Integer
   * urn:x-oca:ocpp:uid:1:569245
   * Values: -3..3, The amountMultiplier defines the exponent to base 10 (dec). The final value is determined by: amount * 10 ^ amountMultiplier
   *
   */
  amountMultiplier?: number;
}

/**
 * Status indicating whether the Charging Station accepts the request to start a transaction.
 *
 */
export type RequestStartStopStatusEnumType = "Accepted" | "Rejected";

export interface RequestStartTransactionResponse {
  customData?: CustomDataType;
  status: RequestStartStopStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * When the transaction was already started by the Charging Station before the RequestStartTransactionRequest was received, for example: cable plugged in first. This contains the transactionId of the already started transaction.
   *
   */
  transactionId?: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface RequestStopTransactionRequest {
  customData?: CustomDataType;
  /**
   * The identifier of the transaction which the Charging Station is requested to stop.
   *
   */
  transactionId: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Status indicating whether Charging Station accepts the request to stop a transaction.
 *
 */
export type RequestStartStopStatusEnumType = "Accepted" | "Rejected";

export interface RequestStopTransactionResponse {
  customData?: CustomDataType;
  status: RequestStartStopStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * The updated reservation status.
 *
 */
export type ReservationUpdateStatusEnumType = "Expired" | "Removed";

export interface ReservationStatusUpdateRequest {
  customData?: CustomDataType;
  /**
   * The ID of the reservation.
   *
   */
  reservationId: number;
  reservationUpdateStatus: ReservationUpdateStatusEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface ReservationStatusUpdateResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This field specifies the connector type.
 *
 */
export type ConnectorEnumType =
  | "cCCS1"
  | "cCCS2"
  | "cG105"
  | "cTesla"
  | "cType1"
  | "cType2"
  | "s309-1P-16A"
  | "s309-1P-32A"
  | "s309-3P-16A"
  | "s309-3P-32A"
  | "sBS1361"
  | "sCEE-7-7"
  | "sType2"
  | "sType3"
  | "Other1PhMax16A"
  | "Other1PhOver16A"
  | "Other3Ph"
  | "Pan"
  | "wInductive"
  | "wResonant"
  | "Undetermined"
  | "Unknown";
/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";

export interface ReserveNowRequest {
  customData?: CustomDataType;
  /**
   * Id of reservation.
   *
   */
  id: number;
  /**
   * Date and time at which the reservation expires.
   *
   */
  expiryDateTime: string;
  connectorType?: ConnectorEnumType;
  idToken: IdTokenType;
  /**
   * This contains ID of the evse to be reserved.
   *
   */
  evseId?: number;
  groupIdToken?: IdTokenType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}

/**
 * This indicates the success or failure of the reservation.
 *
 */
export type ReserveNowStatusEnumType = "Accepted" | "Faulted" | "Occupied" | "Rejected" | "Unavailable";

export interface ReserveNowResponse {
  customData?: CustomDataType;
  status: ReserveNowStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This contains the type of reset that the Charging Station or EVSE should perform.
 *
 */
export type ResetEnumType = "Immediate" | "OnIdle";

export interface ResetRequest {
  customData?: CustomDataType;
  type: ResetEnumType;
  /**
   * This contains the ID of a specific EVSE that needs to be reset, instead of the entire Charging Station.
   *
   */
  evseId?: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This indicates whether the Charging Station is able to perform the reset.
 *
 */
export type ResetStatusEnumType = "Accepted" | "Rejected" | "Scheduled";

export interface ResetResponse {
  customData?: CustomDataType;
  status: ResetStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface SecurityEventNotificationRequest {
  customData?: CustomDataType;
  /**
   * Type of the security event. This value should be taken from the Security events list.
   *
   */
  type: string;
  /**
   * Date and time at which the event occurred.
   *
   */
  timestamp: string;
  /**
   * Additional information about the occurred security event.
   *
   */
  techInfo?: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface SecurityEventNotificationResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";
/**
 * ID_ Token. Status. Authorization_ Status
 * urn:x-oca:ocpp:uid:1:569372
 * Current status of the ID Token.
 *
 */
export type AuthorizationStatusEnumType =
  | "Accepted"
  | "Blocked"
  | "ConcurrentTx"
  | "Expired"
  | "Invalid"
  | "NoCredit"
  | "NotAllowedTypeEVSE"
  | "NotAtThisLocation"
  | "NotAtThisTime"
  | "Unknown";
/**
 * Message_ Content. Format. Message_ Format_ Code
 * urn:x-enexis:ecdm:uid:1:570848
 * Format of the message.
 *
 */
export type MessageFormatEnumType = "ASCII" | "HTML" | "URI" | "UTF8";
/**
 * This contains the type of update (full or differential) of this request.
 *
 */
export type UpdateEnumType = "Differential" | "Full";

export interface SendLocalListRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  localAuthorizationList?: AuthorizationData[];
  /**
   * In case of a full update this is the version number of the full list. In case of a differential update it is the version number of the list after the update has been applied.
   *
   */
  versionNumber: number;
  updateType: UpdateEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Contains the identifier to use for authorization.
 *
 */
export interface AuthorizationData {
  customData?: CustomDataType;
  idToken: IdTokenType;
  idTokenInfo?: IdTokenInfoType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}
/**
 * ID_ Token
 * urn:x-oca:ocpp:uid:2:233247
 * Contains status information about an identifier.
 * It is advised to not stop charging for a token that expires during charging, as ExpiryDate is only used for caching purposes. If ExpiryDate is not given, the status has no end date.
 *
 */
export interface IdTokenInfoType {
  customData?: CustomDataType;
  status: AuthorizationStatusEnumType;
  /**
   * ID_ Token. Expiry. Date_ Time
   * urn:x-oca:ocpp:uid:1:569373
   * Date and Time after which the token must be considered invalid.
   *
   */
  cacheExpiryDateTime?: string;
  /**
   * Priority from a business point of view. Default priority is 0, The range is from -9 to 9. Higher values indicate a higher priority. The chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; overrules this one.
   *
   */
  chargingPriority?: number;
  /**
   * ID_ Token. Language1. Language_ Code
   * urn:x-oca:ocpp:uid:1:569374
   * Preferred user interface language of identifier user. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   *
   */
  language1?: string;
  /**
   * Only used when the IdToken is only valid for one or more specific EVSEs, not for the entire Charging Station.
   *
   *
   *
   * @minItems 1
   */
  evseId?: number[];
  groupIdToken?: IdTokenType;
  /**
   * ID_ Token. Language2. Language_ Code
   * urn:x-oca:ocpp:uid:1:569375
   * Second preferred user interface language of identifier user. Don’t use when language1 is omitted, has to be different from language1. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language2?: string;
  personalMessage?: MessageContentType;
}
/**
 * Message_ Content
 * urn:x-enexis:ecdm:uid:2:234490
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 *
 */
export interface MessageContentType {
  customData?: CustomDataType;
  format: MessageFormatEnumType;
  /**
   * Message_ Content. Language. Language_ Code
   * urn:x-enexis:ecdm:uid:1:570849
   * Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language?: string;
  /**
   * Message_ Content. Content. Message
   * urn:x-enexis:ecdm:uid:1:570852
   * Message contents.
   *
   *
   */
  content: string;
}

/**
 * This indicates whether the Charging Station has successfully received and applied the update of the Local Authorization List.
 *
 */
export type SendLocalListStatusEnumType = "Accepted" | "Failed" | "VersionMismatch";

export interface SendLocalListResponse {
  customData?: CustomDataType;
  status: SendLocalListStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Charging_ Profile. Charging_ Profile_ Purpose. Charging_ Profile_ Purpose_ Code
 * urn:x-oca:ocpp:uid:1:569231
 * Defines the purpose of the schedule transferred by this profile
 *
 */
export type ChargingProfilePurposeEnumType =
  | "ChargingStationExternalConstraints"
  | "ChargingStationMaxProfile"
  | "TxDefaultProfile"
  | "TxProfile";
/**
 * Charging_ Profile. Charging_ Profile_ Kind. Charging_ Profile_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569232
 * Indicates the kind of schedule.
 *
 */
export type ChargingProfileKindEnumType = "Absolute" | "Recurring" | "Relative";
/**
 * Charging_ Profile. Recurrency_ Kind. Recurrency_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569233
 * Indicates the start point of a recurrence.
 *
 */
export type RecurrencyKindEnumType = "Daily" | "Weekly";
/**
 * Charging_ Schedule. Charging_ Rate_ Unit. Charging_ Rate_ Unit_ Code
 * urn:x-oca:ocpp:uid:1:569238
 * The unit of measure Limit is expressed in.
 *
 */
export type ChargingRateUnitEnumType = "W" | "A";
/**
 * Cost. Cost_ Kind. Cost_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569243
 * The kind of cost referred to in the message element amount
 *
 */
export type CostKindEnumType = "CarbonDioxideEmission" | "RelativePricePercentage" | "RenewableGenerationPercentage";

export interface SetChargingProfileRequest {
  customData?: CustomDataType;
  /**
   * For TxDefaultProfile an evseId=0 applies the profile to each individual evse. For ChargingStationMaxProfile and ChargingStationExternalConstraints an evseId=0 contains an overal limit for the whole Charging Station.
   *
   */
  evseId: number;
  chargingProfile: ChargingProfileType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Charging_ Profile
 * urn:x-oca:ocpp:uid:2:233255
 * A ChargingProfile consists of ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 *
 */
export interface ChargingProfileType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Id of ChargingProfile.
   *
   */
  id: number;
  /**
   * Charging_ Profile. Stack_ Level. Counter
   * urn:x-oca:ocpp:uid:1:569230
   * Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0.
   *
   */
  stackLevel: number;
  chargingProfilePurpose: ChargingProfilePurposeEnumType;
  chargingProfileKind: ChargingProfileKindEnumType;
  recurrencyKind?: RecurrencyKindEnumType;
  /**
   * Charging_ Profile. Valid_ From. Date_ Time
   * urn:x-oca:ocpp:uid:1:569234
   * Point in time at which the profile starts to be valid. If absent, the profile is valid as soon as it is received by the Charging Station.
   *
   */
  validFrom?: string;
  /**
   * Charging_ Profile. Valid_ To. Date_ Time
   * urn:x-oca:ocpp:uid:1:569235
   * Point in time at which the profile stops to be valid. If absent, the profile is valid until it is replaced by another profile.
   *
   */
  validTo?: string;
  /**
   * @minItems 1
   * @maxItems 3
   */
  chargingSchedule: ChargingScheduleType[];
  /**
   * SHALL only be included if ChargingProfilePurpose is set to TxProfile. The transactionId is used to match the profile to a specific transaction.
   *
   */
  transactionId?: string;
}
/**
 * Charging_ Schedule
 * urn:x-oca:ocpp:uid:2:233256
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 *
 */
export interface ChargingScheduleType {
  customData?: CustomDataType;
  /**
   * Identifies the ChargingSchedule.
   *
   */
  id: number;
  /**
   * Charging_ Schedule. Start_ Schedule. Date_ Time
   * urn:x-oca:ocpp:uid:1:569237
   * Starting point of an absolute schedule. If absent the schedule will be relative to start of charging.
   *
   */
  startSchedule?: string;
  /**
   * Charging_ Schedule. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569236
   * Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction if chargingProfilePurpose = TxProfile.
   *
   */
  duration?: number;
  chargingRateUnit: ChargingRateUnitEnumType;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
  /**
   * Charging_ Schedule. Min_ Charging_ Rate. Numeric
   * urn:x-oca:ocpp:uid:1:569239
   * Minimum charging rate supported by the EV. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1)
   *
   */
  minChargingRate?: number;
  salesTariff?: SalesTariffType;
}
/**
 * Charging_ Schedule_ Period
 * urn:x-oca:ocpp:uid:2:233257
 * Charging schedule period structure defines a time period in a charging schedule.
 *
 */
export interface ChargingSchedulePeriodType {
  customData?: CustomDataType;
  /**
   * Charging_ Schedule_ Period. Start_ Period. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569240
   * Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.
   *
   */
  startPeriod: number;
  /**
   * Charging_ Schedule_ Period. Limit. Measure
   * urn:x-oca:ocpp:uid:1:569241
   * Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).
   *
   */
  limit: number;
  /**
   * Charging_ Schedule_ Period. Number_ Phases. Counter
   * urn:x-oca:ocpp:uid:1:569242
   * The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.
   *
   */
  numberPhases?: number;
  /**
   * Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own.
   *
   *
   */
  phaseToUse?: number;
}
/**
 * Sales_ Tariff
 * urn:x-oca:ocpp:uid:2:233272
 * NOTE: This dataType is based on dataTypes from &lt;&lt;ref-ISOIEC15118-2,ISO 15118-2&gt;&gt;.
 *
 */
export interface SalesTariffType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * SalesTariff identifier used to identify one sales tariff. An SAID remains a unique identifier for one schedule throughout a charging session.
   *
   */
  id: number;
  /**
   * Sales_ Tariff. Sales. Tariff_ Description
   * urn:x-oca:ocpp:uid:1:569283
   * A human readable title/short description of the sales tariff e.g. for HMI display purposes.
   *
   */
  salesTariffDescription?: string;
  /**
   * Sales_ Tariff. Num_ E_ Price_ Levels. Counter
   * urn:x-oca:ocpp:uid:1:569284
   * Defines the overall number of distinct price levels used across all provided SalesTariff elements.
   *
   */
  numEPriceLevels?: number;
  /**
   * @minItems 1
   * @maxItems 1024
   */
  salesTariffEntry: SalesTariffEntryType[];
}
/**
 * Sales_ Tariff_ Entry
 * urn:x-oca:ocpp:uid:2:233271
 *
 */
export interface SalesTariffEntryType {
  customData?: CustomDataType;
  relativeTimeInterval: RelativeTimeIntervalType;
  /**
   * Sales_ Tariff_ Entry. E_ Price_ Level. Unsigned_ Integer
   * urn:x-oca:ocpp:uid:1:569281
   * Defines the price level of this SalesTariffEntry (referring to NumEPriceLevels). Small values for the EPriceLevel represent a cheaper TariffEntry. Large values for the EPriceLevel represent a more expensive TariffEntry.
   *
   */
  ePriceLevel?: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  consumptionCost?: ConsumptionCostType[];
}
/**
 * Relative_ Timer_ Interval
 * urn:x-oca:ocpp:uid:2:233270
 *
 */
export interface RelativeTimeIntervalType {
  customData?: CustomDataType;
  /**
   * Relative_ Timer_ Interval. Start. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569279
   * Start of the interval, in seconds from NOW.
   *
   */
  start: number;
  /**
   * Relative_ Timer_ Interval. Duration. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569280
   * Duration of the interval, in seconds.
   *
   */
  duration?: number;
}
/**
 * Consumption_ Cost
 * urn:x-oca:ocpp:uid:2:233259
 *
 */
export interface ConsumptionCostType {
  customData?: CustomDataType;
  /**
   * Consumption_ Cost. Start_ Value. Numeric
   * urn:x-oca:ocpp:uid:1:569246
   * The lowest level of consumption that defines the starting point of this consumption block. The block interval extends to the start of the next interval.
   *
   */
  startValue: number;
  /**
   * @minItems 1
   * @maxItems 3
   */
  cost: CostType[];
}
/**
 * Cost
 * urn:x-oca:ocpp:uid:2:233258
 *
 */
export interface CostType {
  customData?: CustomDataType;
  costKind: CostKindEnumType;
  /**
   * Cost. Amount. Amount
   * urn:x-oca:ocpp:uid:1:569244
   * The estimated or actual cost per kWh
   *
   */
  amount: number;
  /**
   * Cost. Amount_ Multiplier. Integer
   * urn:x-oca:ocpp:uid:1:569245
   * Values: -3..3, The amountMultiplier defines the exponent to base 10 (dec). The final value is determined by: amount * 10 ^ amountMultiplier
   *
   */
  amountMultiplier?: number;
}

/**
 * Returns whether the Charging Station has been able to process the message successfully. This does not guarantee the schedule will be followed to the letter. There might be other constraints the Charging Station may need to take into account.
 *
 */
export type ChargingProfileStatusEnumType = "Accepted" | "Rejected";

export interface SetChargingProfileResponse {
  customData?: CustomDataType;
  status: ChargingProfileStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Message_ Info. Priority. Message_ Priority_ Code
 * urn:x-enexis:ecdm:uid:1:569253
 * With what priority should this message be shown
 *
 */
export type MessagePriorityEnumType = "AlwaysFront" | "InFront" | "NormalCycle";
/**
 * Message_ Info. State. Message_ State_ Code
 * urn:x-enexis:ecdm:uid:1:569254
 * During what state should this message be shown. When omitted this message should be shown in any state of the Charging Station.
 *
 */
export type MessageStateEnumType = "Charging" | "Faulted" | "Idle" | "Unavailable";
/**
 * Message_ Content. Format. Message_ Format_ Code
 * urn:x-enexis:ecdm:uid:1:570848
 * Format of the message.
 *
 */
export type MessageFormatEnumType = "ASCII" | "HTML" | "URI" | "UTF8";

export interface SetDisplayMessageRequest {
  customData?: CustomDataType;
  message: MessageInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Message_ Info
 * urn:x-enexis:ecdm:uid:2:233264
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 */
export interface MessageInfoType {
  customData?: CustomDataType;
  display?: ComponentType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * Master resource identifier, unique within an exchange context. It is defined within the OCPP context as a positive Integer value (greater or equal to zero).
   *
   */
  id: number;
  priority: MessagePriorityEnumType;
  state?: MessageStateEnumType;
  /**
   * Message_ Info. Start. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569256
   * From what date-time should this message be shown. If omitted: directly.
   *
   */
  startDateTime?: string;
  /**
   * Message_ Info. End. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569257
   * Until what date-time should this message be shown, after this date/time this message SHALL be removed.
   *
   */
  endDateTime?: string;
  /**
   * During which transaction shall this message be shown.
   * Message SHALL be removed by the Charging Station after transaction has
   * ended.
   *
   */
  transactionId?: string;
  message: MessageContentType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Message_ Content
 * urn:x-enexis:ecdm:uid:2:234490
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 *
 */
export interface MessageContentType {
  customData?: CustomDataType;
  format: MessageFormatEnumType;
  /**
   * Message_ Content. Language. Language_ Code
   * urn:x-enexis:ecdm:uid:1:570849
   * Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language?: string;
  /**
   * Message_ Content. Content. Message
   * urn:x-enexis:ecdm:uid:1:570852
   * Message contents.
   *
   *
   */
  content: string;
}

/**
 * This indicates whether the Charging Station is able to display the message.
 *
 */
export type DisplayMessageStatusEnumType =
  | "Accepted"
  | "NotSupportedMessageFormat"
  | "Rejected"
  | "NotSupportedPriority"
  | "NotSupportedState"
  | "UnknownTransaction";

export interface SetDisplayMessageResponse {
  customData?: CustomDataType;
  status: DisplayMessageStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * Specify which monitoring base will be set
 *
 */
export type MonitoringBaseEnumType = "All" | "FactoryDefault" | "HardWiredOnly";

export interface SetMonitoringBaseRequest {
  customData?: CustomDataType;
  monitoringBase: MonitoringBaseEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates whether the Charging Station was able to accept the request.
 *
 */
export type GenericDeviceModelStatusEnumType = "Accepted" | "Rejected" | "NotSupported" | "EmptyResultSet";

export interface SetMonitoringBaseResponse {
  customData?: CustomDataType;
  status: GenericDeviceModelStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface SetMonitoringLevelRequest {
  customData?: CustomDataType;
  /**
   * The Charging Station SHALL only report events with a severity number lower than or equal to this severity.
   * The severity range is 0-9, with 0 as the highest and 9 as the lowest severity level.
   *
   * The severity levels have the following meaning: +
   * *0-Danger* +
   * Indicates lives are potentially in danger. Urgent attention is needed and action should be taken immediately. +
   * *1-Hardware Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to Hardware issues. Action is required. +
   * *2-System Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to software or minor hardware issues. Action is required. +
   * *3-Critical* +
   * Indicates a critical error. Action is required. +
   * *4-Error* +
   * Indicates a non-urgent error. Action is required. +
   * *5-Alert* +
   * Indicates an alert event. Default severity for any type of monitoring event.  +
   * *6-Warning* +
   * Indicates a warning event. Action may be required. +
   * *7-Notice* +
   * Indicates an unusual event. No immediate action is required. +
   * *8-Informational* +
   * Indicates a regular operational event. May be used for reporting, measuring throughput, etc. No action is required. +
   * *9-Debug* +
   * Indicates information useful to developers for debugging, not useful during operations.
   *
   *
   *
   */
  severity: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates whether the Charging Station was able to accept the request.
 *
 */
export type GenericStatusEnumType = "Accepted" | "Rejected";

export interface SetMonitoringLevelResponse {
  customData?: CustomDataType;
  status: GenericStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * APN. APN_ Authentication. APN_ Authentication_ Code
 * urn:x-oca:ocpp:uid:1:568828
 * Authentication method.
 *
 */
export type APNAuthenticationEnumType = "CHAP" | "NONE" | "PAP" | "AUTO";
/**
 * Communication_ Function. OCPP_ Version. OCPP_ Version_ Code
 * urn:x-oca:ocpp:uid:1:569355
 * Defines the OCPP version used for this communication function.
 *
 */
export type OCPPVersionEnumType = "OCPP12" | "OCPP15" | "OCPP16" | "OCPP20";
/**
 * Communication_ Function. OCPP_ Transport. OCPP_ Transport_ Code
 * urn:x-oca:ocpp:uid:1:569356
 * Defines the transport protocol (e.g. SOAP or JSON). Note: SOAP is not supported in OCPP 2.0, but is supported by other versions of OCPP.
 *
 */
export type OCPPTransportEnumType = "JSON" | "SOAP";
/**
 * Applicable Network Interface.
 *
 */
export type OCPPInterfaceEnumType =
  | "Wired0"
  | "Wired1"
  | "Wired2"
  | "Wired3"
  | "Wireless0"
  | "Wireless1"
  | "Wireless2"
  | "Wireless3";
/**
 * VPN. Type. VPN_ Code
 * urn:x-oca:ocpp:uid:1:569277
 * Type of VPN
 *
 */
export type VPNEnumType = "IKEv2" | "IPSec" | "L2TP" | "PPTP";

export interface SetNetworkProfileRequest {
  customData?: CustomDataType;
  /**
   * Slot in which the configuration should be stored.
   *
   */
  configurationSlot: number;
  connectionData: NetworkConnectionProfileType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Communication_ Function
 * urn:x-oca:ocpp:uid:2:233304
 * The NetworkConnectionProfile defines the functional and technical parameters of a communication link.
 *
 */
export interface NetworkConnectionProfileType {
  customData?: CustomDataType;
  apn?: APNType;
  ocppVersion: OCPPVersionEnumType;
  ocppTransport: OCPPTransportEnumType;
  /**
   * Communication_ Function. OCPP_ Central_ System_ URL. URI
   * urn:x-oca:ocpp:uid:1:569357
   * URL of the CSMS(s) that this Charging Station  communicates with.
   *
   */
  ocppCsmsUrl: string;
  /**
   * Duration in seconds before a message send by the Charging Station via this network connection times-out.
   * The best setting depends on the underlying network and response times of the CSMS.
   * If you are looking for a some guideline: use 30 seconds as a starting point.
   *
   */
  messageTimeout: number;
  /**
   * This field specifies the security profile used when connecting to the CSMS with this NetworkConnectionProfile.
   *
   */
  securityProfile: number;
  ocppInterface: OCPPInterfaceEnumType;
  vpn?: VPNType;
}
/**
 * APN
 * urn:x-oca:ocpp:uid:2:233134
 * Collection of configuration data needed to make a data-connection over a cellular network.
 *
 * NOTE: When asking a GSM modem to dial in, it is possible to specify which mobile operator should be used. This can be done with the mobile country code (MCC) in combination with a mobile network code (MNC). Example: If your preferred network is Vodafone Netherlands, the MCC=204 and the MNC=04 which means the key PreferredNetwork = 20404 Some modems allows to specify a preferred network, which means, if this network is not available, a different network is used. If you specify UseOnlyPreferredNetwork and this network is not available, the modem will not dial in.
 *
 */
export interface APNType {
  customData?: CustomDataType;
  /**
   * APN. APN. URI
   * urn:x-oca:ocpp:uid:1:568814
   * The Access Point Name as an URL.
   *
   */
  apn: string;
  /**
   * APN. APN. User_ Name
   * urn:x-oca:ocpp:uid:1:568818
   * APN username.
   *
   */
  apnUserName?: string;
  /**
   * APN. APN. Password
   * urn:x-oca:ocpp:uid:1:568819
   * APN Password.
   *
   */
  apnPassword?: string;
  /**
   * APN. SIMPIN. PIN_ Code
   * urn:x-oca:ocpp:uid:1:568821
   * SIM card pin code.
   *
   */
  simPin?: number;
  /**
   * APN. Preferred_ Network. Mobile_ Network_ ID
   * urn:x-oca:ocpp:uid:1:568822
   * Preferred network, written as MCC and MNC concatenated. See note.
   *
   */
  preferredNetwork?: string;
  /**
   * APN. Use_ Only_ Preferred_ Network. Indicator
   * urn:x-oca:ocpp:uid:1:568824
   * Default: false. Use only the preferred Network, do
   * not dial in when not available. See Note.
   *
   */
  useOnlyPreferredNetwork?: boolean;
  apnAuthentication: APNAuthenticationEnumType;
}
/**
 * VPN
 * urn:x-oca:ocpp:uid:2:233268
 * VPN Configuration settings
 *
 */
export interface VPNType {
  customData?: CustomDataType;
  /**
   * VPN. Server. URI
   * urn:x-oca:ocpp:uid:1:569272
   * VPN Server Address
   *
   */
  server: string;
  /**
   * VPN. User. User_ Name
   * urn:x-oca:ocpp:uid:1:569273
   * VPN User
   *
   */
  user: string;
  /**
   * VPN. Group. Group_ Name
   * urn:x-oca:ocpp:uid:1:569274
   * VPN group.
   *
   */
  group?: string;
  /**
   * VPN. Password. Password
   * urn:x-oca:ocpp:uid:1:569275
   * VPN Password.
   *
   */
  password: string;
  /**
   * VPN. Key. VPN_ Key
   * urn:x-oca:ocpp:uid:1:569276
   * VPN shared secret.
   *
   */
  key: string;
  type: VPNEnumType;
}

/**
 * Result of operation.
 *
 */
export type SetNetworkProfileStatusEnumType = "Accepted" | "Rejected" | "Failed";

export interface SetNetworkProfileResponse {
  customData?: CustomDataType;
  status: SetNetworkProfileStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * The type of this monitor, e.g. a threshold, delta or periodic monitor.
 *
 *
 */
export type MonitorEnumType = "UpperThreshold" | "LowerThreshold" | "Delta" | "Periodic" | "PeriodicClockAligned";

export interface SetVariableMonitoringRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  setMonitoringData: SetMonitoringDataType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to hold parameters of SetVariableMonitoring request.
 *
 */
export interface SetMonitoringDataType {
  customData?: CustomDataType;
  /**
   * An id SHALL only be given to replace an existing monitor. The Charging Station handles the generation of id's for new monitors.
   *
   *
   */
  id?: number;
  /**
   * Monitor only active when a transaction is ongoing on a component relevant to this transaction. Default = false.
   *
   *
   */
  transaction?: boolean;
  /**
   * Value for threshold or delta monitoring.
   * For Periodic or PeriodicClockAligned this is the interval in seconds.
   *
   *
   */
  value: number;
  type: MonitorEnumType;
  /**
   * The severity that will be assigned to an event that is triggered by this monitor. The severity range is 0-9, with 0 as the highest and 9 as the lowest severity level.
   *
   * The severity levels have the following meaning: +
   * *0-Danger* +
   * Indicates lives are potentially in danger. Urgent attention is needed and action should be taken immediately. +
   * *1-Hardware Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to Hardware issues. Action is required. +
   * *2-System Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to software or minor hardware issues. Action is required. +
   * *3-Critical* +
   * Indicates a critical error. Action is required. +
   * *4-Error* +
   * Indicates a non-urgent error. Action is required. +
   * *5-Alert* +
   * Indicates an alert event. Default severity for any type of monitoring event.  +
   * *6-Warning* +
   * Indicates a warning event. Action may be required. +
   * *7-Notice* +
   * Indicates an unusual event. No immediate action is required. +
   * *8-Informational* +
   * Indicates a regular operational event. May be used for reporting, measuring throughput, etc. No action is required. +
   * *9-Debug* +
   * Indicates information useful to developers for debugging, not useful during operations.
   *
   *
   */
  severity: number;
  component: ComponentType;
  variable: VariableType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * Status is OK if a value could be returned. Otherwise this will indicate the reason why a value could not be returned.
 *
 */
export type SetMonitoringStatusEnumType =
  | "Accepted"
  | "UnknownComponent"
  | "UnknownVariable"
  | "UnsupportedMonitorType"
  | "Rejected"
  | "Duplicate";
/**
 * The type of this monitor, e.g. a threshold, delta or periodic monitor.
 *
 *
 */
export type MonitorEnumType = "UpperThreshold" | "LowerThreshold" | "Delta" | "Periodic" | "PeriodicClockAligned";

export interface SetVariableMonitoringResponse {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  setMonitoringResult: SetMonitoringResultType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Class to hold result of SetVariableMonitoring request.
 *
 */
export interface SetMonitoringResultType {
  customData?: CustomDataType;
  /**
   * Id given to the VariableMonitor by the Charging Station. The Id is only returned when status is accepted. Installed VariableMonitors should have unique id's but the id's of removed Installed monitors should have unique id's but the id's of removed monitors MAY be reused.
   *
   */
  id?: number;
  statusInfo?: StatusInfoType;
  status: SetMonitoringStatusEnumType;
  type: MonitorEnumType;
  component: ComponentType;
  variable: VariableType;
  /**
   * The severity that will be assigned to an event that is triggered by this monitor. The severity range is 0-9, with 0 as the highest and 9 as the lowest severity level.
   *
   * The severity levels have the following meaning: +
   * *0-Danger* +
   * Indicates lives are potentially in danger. Urgent attention is needed and action should be taken immediately. +
   * *1-Hardware Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to Hardware issues. Action is required. +
   * *2-System Failure* +
   * Indicates that the Charging Station is unable to continue regular operations due to software or minor hardware issues. Action is required. +
   * *3-Critical* +
   * Indicates a critical error. Action is required. +
   * *4-Error* +
   * Indicates a non-urgent error. Action is required. +
   * *5-Alert* +
   * Indicates an alert event. Default severity for any type of monitoring event.  +
   * *6-Warning* +
   * Indicates a warning event. Action may be required. +
   * *7-Notice* +
   * Indicates an unusual event. No immediate action is required. +
   * *8-Informational* +
   * Indicates a regular operational event. May be used for reporting, measuring throughput, etc. No action is required. +
   * *9-Debug* +
   * Indicates information useful to developers for debugging, not useful during operations.
   *
   *
   */
  severity: number;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * Type of attribute: Actual, Target, MinSet, MaxSet. Default is Actual when omitted.
 *
 */
export type AttributeEnumType = "Actual" | "Target" | "MinSet" | "MaxSet";

export interface SetVariablesRequest {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  setVariableData: SetVariableDataType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface SetVariableDataType {
  customData?: CustomDataType;
  attributeType?: AttributeEnumType;
  /**
   * Value to be assigned to attribute of variable.
   *
   * The Configuration Variable &lt;&lt;configkey-configuration-value-size,ConfigurationValueSize&gt;&gt; can be used to limit SetVariableData.attributeValue and VariableCharacteristics.valueList. The max size of these values will always remain equal.
   *
   */
  attributeValue: string;
  component: ComponentType;
  variable: VariableType;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * Type of attribute: Actual, Target, MinSet, MaxSet. Default is Actual when omitted.
 *
 */
export type AttributeEnumType = "Actual" | "Target" | "MinSet" | "MaxSet";
/**
 * Result status of setting the variable.
 *
 */
export type SetVariableStatusEnumType =
  | "Accepted"
  | "Rejected"
  | "UnknownComponent"
  | "UnknownVariable"
  | "NotSupportedAttributeType"
  | "RebootRequired";

export interface SetVariablesResponse {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  setVariableResult: SetVariableResultType[];
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
export interface SetVariableResultType {
  customData?: CustomDataType;
  attributeType?: AttributeEnumType;
  attributeStatus: SetVariableStatusEnumType;
  attributeStatusInfo?: StatusInfoType;
  component: ComponentType;
  variable: VariableType;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}
/**
 * A physical or logical component
 *
 */
export interface ComponentType {
  customData?: CustomDataType;
  evse?: EVSEType;
  /**
   * Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Reference key to a component-variable.
 *
 */
export interface VariableType {
  customData?: CustomDataType;
  /**
   * Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  name: string;
  /**
   * Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.
   *
   */
  instance?: string;
}

/**
 * Indicates the type of certificate that is to be signed. When omitted the certificate is to be used for both the 15118 connection (if implemented) and the Charging Station to CSMS connection.
 *
 *
 */
export type CertificateSigningUseEnumType = "ChargingStationCertificate" | "V2GCertificate";

export interface SignCertificateRequest {
  customData?: CustomDataType;
  /**
   * The Charging Station SHALL send the public key in form of a Certificate Signing Request (CSR) as described in RFC 2986 [22] and then PEM encoded, using the &lt;&lt;signcertificaterequest,SignCertificateRequest&gt;&gt; message.
   *
   */
  csr: string;
  certificateType?: CertificateSigningUseEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Specifies whether the CSMS can process the request.
 *
 */
export type GenericStatusEnumType = "Accepted" | "Rejected";

export interface SignCertificateResponse {
  customData?: CustomDataType;
  status: GenericStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

/**
 * This contains the current status of the Connector.
 *
 */
export type ConnectorStatusEnumType = "Available" | "Occupied" | "Reserved" | "Unavailable" | "Faulted";

export interface StatusNotificationRequest {
  customData?: CustomDataType;
  /**
   * The time for which the status is reported. If absent time of receipt of the message will be assumed.
   *
   */
  timestamp: string;
  connectorStatus: ConnectorStatusEnumType;
  /**
   * The id of the EVSE to which the connector belongs for which the the status is reported.
   *
   */
  evseId: number;
  /**
   * The id of the connector within the EVSE for which the status is reported.
   *
   */
  connectorId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface StatusNotificationResponse {
  customData?: CustomDataType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This contains the type of this event.
 * The first TransactionEvent of a transaction SHALL contain: "Started" The last TransactionEvent of a transaction SHALL contain: "Ended" All others SHALL contain: "Updated"
 *
 */
export type TransactionEventEnumType = "Ended" | "Started" | "Updated";
/**
 * Sampled_ Value. Context. Reading_ Context_ Code
 * urn:x-oca:ocpp:uid:1:569261
 * Type of detail value: start, end or sample. Default = "Sample.Periodic"
 *
 */
export type ReadingContextEnumType =
  | "Interruption.Begin"
  | "Interruption.End"
  | "Other"
  | "Sample.Clock"
  | "Sample.Periodic"
  | "Transaction.Begin"
  | "Transaction.End"
  | "Trigger";
/**
 * Sampled_ Value. Measurand. Measurand_ Code
 * urn:x-oca:ocpp:uid:1:569263
 * Type of measurement. Default = "Energy.Active.Import.Register"
 *
 */
export type MeasurandEnumType =
  | "Current.Export"
  | "Current.Import"
  | "Current.Offered"
  | "Energy.Active.Export.Register"
  | "Energy.Active.Import.Register"
  | "Energy.Reactive.Export.Register"
  | "Energy.Reactive.Import.Register"
  | "Energy.Active.Export.Interval"
  | "Energy.Active.Import.Interval"
  | "Energy.Active.Net"
  | "Energy.Reactive.Export.Interval"
  | "Energy.Reactive.Import.Interval"
  | "Energy.Reactive.Net"
  | "Energy.Apparent.Net"
  | "Energy.Apparent.Import"
  | "Energy.Apparent.Export"
  | "Frequency"
  | "Power.Active.Export"
  | "Power.Active.Import"
  | "Power.Factor"
  | "Power.Offered"
  | "Power.Reactive.Export"
  | "Power.Reactive.Import"
  | "SoC"
  | "Voltage";
/**
 * Sampled_ Value. Phase. Phase_ Code
 * urn:x-oca:ocpp:uid:1:569264
 * Indicates how the measured value is to be interpreted. For instance between L1 and neutral (L1-N) Please note that not all values of phase are applicable to all Measurands. When phase is absent, the measured value is interpreted as an overall value.
 *
 */
export type PhaseEnumType = "L1" | "L2" | "L3" | "N" | "L1-N" | "L2-N" | "L3-N" | "L1-L2" | "L2-L3" | "L3-L1";
/**
 * Sampled_ Value. Location. Location_ Code
 * urn:x-oca:ocpp:uid:1:569265
 * Indicates where the measured value has been sampled. Default =  "Outlet"
 *
 *
 */
export type LocationEnumType = "Body" | "Cable" | "EV" | "Inlet" | "Outlet";
/**
 * Reason the Charging Station sends this message to the CSMS
 *
 */
export type TriggerReasonEnumType =
  | "Authorized"
  | "CablePluggedIn"
  | "ChargingRateChanged"
  | "ChargingStateChanged"
  | "Deauthorized"
  | "EnergyLimitReached"
  | "EVCommunicationLost"
  | "EVConnectTimeout"
  | "MeterValueClock"
  | "MeterValuePeriodic"
  | "TimeLimitReached"
  | "Trigger"
  | "UnlockCommand"
  | "StopAuthorized"
  | "EVDeparted"
  | "EVDetected"
  | "RemoteStop"
  | "RemoteStart"
  | "AbnormalCondition"
  | "SignedDataReceived"
  | "ResetCommand";
/**
 * Transaction. State. Transaction_ State_ Code
 * urn:x-oca:ocpp:uid:1:569419
 * Current charging state, is required when state
 * has changed.
 *
 */
export type ChargingStateEnumType = "Charging" | "EVConnected" | "SuspendedEV" | "SuspendedEVSE" | "Idle";
/**
 * Transaction. Stopped_ Reason. EOT_ Reason_ Code
 * urn:x-oca:ocpp:uid:1:569413
 * This contains the reason why the transaction was stopped. MAY only be omitted when Reason is "Local".
 *
 */
export type ReasonEnumType =
  | "DeAuthorized"
  | "EmergencyStop"
  | "EnergyLimitReached"
  | "EVDisconnected"
  | "GroundFault"
  | "ImmediateReset"
  | "Local"
  | "LocalOutOfCredit"
  | "MasterPass"
  | "Other"
  | "OvercurrentFault"
  | "PowerLoss"
  | "PowerQuality"
  | "Reboot"
  | "Remote"
  | "SOCLimitReached"
  | "StoppedByEV"
  | "TimeLimitReached"
  | "Timeout";
/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";

export interface TransactionEventRequest {
  customData?: CustomDataType;
  eventType: TransactionEventEnumType;
  /**
   * @minItems 1
   */
  meterValue?: MeterValueType[];
  /**
   * The date and time at which this transaction event occurred.
   *
   */
  timestamp: string;
  triggerReason: TriggerReasonEnumType;
  /**
   * Incremental sequence number, helps with determining if all messages of a transaction have been received.
   *
   */
  seqNo: number;
  /**
   * Indication that this transaction event happened when the Charging Station was offline. Default = false, meaning: the event occurred when the Charging Station was online.
   *
   */
  offline?: boolean;
  /**
   * If the Charging Station is able to report the number of phases used, then it SHALL provide it. When omitted the CSMS may be able to determine the number of phases used via device management.
   *
   */
  numberOfPhasesUsed?: number;
  /**
   * The maximum current of the connected cable in Ampere (A).
   *
   */
  cableMaxCurrent?: number;
  /**
   * This contains the Id of the reservation that terminates as a result of this transaction.
   *
   */
  reservationId?: number;
  transactionInfo: TransactionType;
  evse?: EVSEType;
  idToken?: IdTokenType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Meter_ Value
 * urn:x-oca:ocpp:uid:2:233265
 * Collection of one or more sampled values in MeterValuesRequest and TransactionEvent. All sampled values in a MeterValue are sampled at the same point in time.
 *
 */
export interface MeterValueType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  sampledValue: SampledValueType[];
  /**
   * Meter_ Value. Timestamp. Date_ Time
   * urn:x-oca:ocpp:uid:1:569259
   * Timestamp for measured value(s).
   *
   */
  timestamp: string;
}
/**
 * Sampled_ Value
 * urn:x-oca:ocpp:uid:2:233266
 * Single sampled value in MeterValues. Each value can be accompanied by optional fields.
 *
 * To save on mobile data usage, default values of all of the optional fields are such that. The value without any additional fields will be interpreted, as a register reading of active import energy in Wh (Watt-hour) units.
 *
 */
export interface SampledValueType {
  customData?: CustomDataType;
  /**
   * Sampled_ Value. Value. Measure
   * urn:x-oca:ocpp:uid:1:569260
   * Indicates the measured value.
   *
   *
   */
  value: number;
  context?: ReadingContextEnumType;
  measurand?: MeasurandEnumType;
  phase?: PhaseEnumType;
  location?: LocationEnumType;
  signedMeterValue?: SignedMeterValueType;
  unitOfMeasure?: UnitOfMeasureType;
}
/**
 * Represent a signed version of the meter value.
 *
 */
export interface SignedMeterValueType {
  customData?: CustomDataType;
  /**
   * Base64 encoded, contains the signed data which might contain more then just the meter value. It can contain information like timestamps, reference to a customer etc.
   *
   */
  signedMeterData: string;
  /**
   * Method used to create the digital signature.
   *
   */
  signingMethod: string;
  /**
   * Method used to encode the meter values before applying the digital signature algorithm.
   *
   */
  encodingMethod: string;
  /**
   * Base64 encoded, sending depends on configuration variable _PublicKeyWithSignedMeterValue_.
   *
   */
  publicKey: string;
}
/**
 * Represents a UnitOfMeasure with a multiplier
 *
 */
export interface UnitOfMeasureType {
  customData?: CustomDataType;
  /**
   * Unit of the value. Default = "Wh" if the (default) measurand is an "Energy" type.
   * This field SHALL use a value from the list Standardized Units of Measurements in Part 2 Appendices.
   * If an applicable unit is available in that list, otherwise a "custom" unit might be used.
   *
   */
  unit?: string;
  /**
   * Multiplier, this value represents the exponent to base 10. I.e. multiplier 3 means 10 raised to the 3rd power. Default is 0.
   *
   */
  multiplier?: number;
}
/**
 * Transaction
 * urn:x-oca:ocpp:uid:2:233318
 *
 */
export interface TransactionType {
  customData?: CustomDataType;
  /**
   * This contains the Id of the transaction.
   *
   */
  transactionId: string;
  chargingState?: ChargingStateEnumType;
  /**
   * Transaction. Time_ Spent_ Charging. Elapsed_ Time
   * urn:x-oca:ocpp:uid:1:569415
   * Contains the total time that energy flowed from EVSE to EV during the transaction (in seconds). Note that timeSpentCharging is smaller or equal to the duration of the transaction.
   *
   */
  timeSpentCharging?: number;
  stoppedReason?: ReasonEnumType;
  /**
   * The ID given to remote start request (&lt;&lt;requeststarttransactionrequest, RequestStartTransactionRequest&gt;&gt;. This enables to CSMS to match the started transaction to the given start request.
   *
   */
  remoteStartId?: number;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}

/**
 * ID_ Token. Status. Authorization_ Status
 * urn:x-oca:ocpp:uid:1:569372
 * Current status of the ID Token.
 *
 */
export type AuthorizationStatusEnumType =
  | "Accepted"
  | "Blocked"
  | "ConcurrentTx"
  | "Expired"
  | "Invalid"
  | "NoCredit"
  | "NotAllowedTypeEVSE"
  | "NotAtThisLocation"
  | "NotAtThisTime"
  | "Unknown";
/**
 * Enumeration of possible idToken types.
 *
 */
export type IdTokenEnumType =
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization";
/**
 * Message_ Content. Format. Message_ Format_ Code
 * urn:x-enexis:ecdm:uid:1:570848
 * Format of the message.
 *
 */
export type MessageFormatEnumType = "ASCII" | "HTML" | "URI" | "UTF8";

export interface TransactionEventResponse {
  customData?: CustomDataType;
  /**
   * SHALL only be sent when charging has ended. Final total cost of this transaction, including taxes. In the currency configured with the Configuration Variable: &lt;&lt;configkey-currency,`Currency`&gt;&gt;. When omitted, the transaction was NOT free. To indicate a free transaction, the CSMS SHALL send 0.00.
   *
   *
   */
  totalCost?: number;
  /**
   * Priority from a business point of view. Default priority is 0, The range is from -9 to 9. Higher values indicate a higher priority. The chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; is temporarily, so it may not be set in the &lt;&lt;cmn_idtokeninfotype,IdTokenInfoType&gt;&gt; afterwards. Also the chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; overrules the one in &lt;&lt;cmn_idtokeninfotype,IdTokenInfoType&gt;&gt;.
   *
   */
  chargingPriority?: number;
  idTokenInfo?: IdTokenInfoType;
  updatedPersonalMessage?: MessageContentType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * ID_ Token
 * urn:x-oca:ocpp:uid:2:233247
 * Contains status information about an identifier.
 * It is advised to not stop charging for a token that expires during charging, as ExpiryDate is only used for caching purposes. If ExpiryDate is not given, the status has no end date.
 *
 */
export interface IdTokenInfoType {
  customData?: CustomDataType;
  status: AuthorizationStatusEnumType;
  /**
   * ID_ Token. Expiry. Date_ Time
   * urn:x-oca:ocpp:uid:1:569373
   * Date and Time after which the token must be considered invalid.
   *
   */
  cacheExpiryDateTime?: string;
  /**
   * Priority from a business point of view. Default priority is 0, The range is from -9 to 9. Higher values indicate a higher priority. The chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; overrules this one.
   *
   */
  chargingPriority?: number;
  /**
   * ID_ Token. Language1. Language_ Code
   * urn:x-oca:ocpp:uid:1:569374
   * Preferred user interface language of identifier user. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   *
   */
  language1?: string;
  /**
   * Only used when the IdToken is only valid for one or more specific EVSEs, not for the entire Charging Station.
   *
   *
   *
   * @minItems 1
   */
  evseId?: number[];
  groupIdToken?: IdTokenType;
  /**
   * ID_ Token. Language2. Language_ Code
   * urn:x-oca:ocpp:uid:1:569375
   * Second preferred user interface language of identifier user. Don’t use when language1 is omitted, has to be different from language1. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language2?: string;
  personalMessage?: MessageContentType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface IdTokenType {
  customData?: CustomDataType;
  /**
   * @minItems 1
   */
  additionalInfo?: AdditionalInfoType[];
  /**
   * IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID.
   *
   */
  idToken: string;
  type: IdTokenEnumType;
}
/**
 * Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.
 *
 */
export interface AdditionalInfoType {
  customData?: CustomDataType;
  /**
   * This field specifies the additional IdToken.
   *
   */
  additionalIdToken: string;
  /**
   * This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.
   *
   */
  type: string;
}
/**
 * Message_ Content
 * urn:x-enexis:ecdm:uid:2:234490
 * Contains message details, for a message to be displayed on a Charging Station.
 *
 *
 */
export interface MessageContentType {
  customData?: CustomDataType;
  format: MessageFormatEnumType;
  /**
   * Message_ Content. Language. Language_ Code
   * urn:x-enexis:ecdm:uid:1:570849
   * Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.
   *
   */
  language?: string;
  /**
   * Message_ Content. Content. Message
   * urn:x-enexis:ecdm:uid:1:570852
   * Message contents.
   *
   *
   */
  content: string;
}

/**
 * Type of message to be triggered.
 *
 */
export type MessageTriggerEnumType =
  | "BootNotification"
  | "LogStatusNotification"
  | "FirmwareStatusNotification"
  | "Heartbeat"
  | "MeterValues"
  | "SignChargingStationCertificate"
  | "SignV2GCertificate"
  | "StatusNotification"
  | "TransactionEvent"
  | "SignCombinedCertificate"
  | "PublishFirmwareStatusNotification";

export interface TriggerMessageRequest {
  customData?: CustomDataType;
  evse?: EVSEType;
  requestedMessage: MessageTriggerEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * EVSE
 * urn:x-oca:ocpp:uid:2:233123
 * Electric Vehicle Supply Equipment
 *
 */
export interface EVSEType {
  customData?: CustomDataType;
  /**
   * Identified_ Object. MRID. Numeric_ Identifier
   * urn:x-enexis:ecdm:uid:1:569198
   * EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station.
   *
   */
  id: number;
  /**
   * An id to designate a specific connector (on an EVSE) by connector index number.
   *
   */
  connectorId?: number;
}

/**
 * Indicates whether the Charging Station will send the requested notification or not.
 *
 */
export type TriggerMessageStatusEnumType = "Accepted" | "Rejected" | "NotImplemented";

export interface TriggerMessageResponse {
  customData?: CustomDataType;
  status: TriggerMessageStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface UnlockConnectorRequest {
  customData?: CustomDataType;
  /**
   * This contains the identifier of the EVSE for which a connector needs to be unlocked.
   *
   */
  evseId: number;
  /**
   * This contains the identifier of the connector that needs to be unlocked.
   *
   */
  connectorId: number;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * This indicates whether the Charging Station has unlocked the connector.
 *
 */
export type UnlockStatusEnumType = "Unlocked" | "UnlockFailed" | "OngoingAuthorizedTransaction" | "UnknownConnector";

export interface UnlockConnectorResponse {
  customData?: CustomDataType;
  status: UnlockStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface UnpublishFirmwareRequest {
  customData?: CustomDataType;
  /**
   * The MD5 checksum over the entire firmware file as a hexadecimal string of length 32.
   *
   */
  checksum: string;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

/**
 * Indicates whether the Local Controller succeeded in unpublishing the firmware.
 *
 */
export type UnpublishFirmwareStatusEnumType = "DownloadOngoing" | "NoFirmware" | "Unpublished";

export interface UnpublishFirmwareResponse {
  customData?: CustomDataType;
  status: UnpublishFirmwareStatusEnumType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}

export interface UpdateFirmwareRequest {
  customData?: CustomDataType;
  /**
   * This specifies how many times Charging Station must try to download the firmware before giving up. If this field is not present, it is left to Charging Station to decide how many times it wants to retry.
   *
   */
  retries?: number;
  /**
   * The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charging Station to decide how long to wait between attempts.
   *
   */
  retryInterval?: number;
  /**
   * The Id of this request
   *
   */
  requestId: number;
  firmware: FirmwareType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Firmware
 * urn:x-enexis:ecdm:uid:2:233291
 * Represents a copy of the firmware that can be loaded/updated on the Charging Station.
 *
 */
export interface FirmwareType {
  customData?: CustomDataType;
  /**
   * Firmware. Location. URI
   * urn:x-enexis:ecdm:uid:1:569460
   * URI defining the origin of the firmware.
   *
   */
  location: string;
  /**
   * Firmware. Retrieve. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569461
   * Date and time at which the firmware shall be retrieved.
   *
   */
  retrieveDateTime: string;
  /**
   * Firmware. Install. Date_ Time
   * urn:x-enexis:ecdm:uid:1:569462
   * Date and time at which the firmware shall be installed.
   *
   */
  installDateTime?: string;
  /**
   * Certificate with which the firmware was signed.
   * PEM encoded X.509 certificate.
   *
   */
  signingCertificate?: string;
  /**
   * Firmware. Signature. Signature
   * urn:x-enexis:ecdm:uid:1:569464
   * Base64 encoded firmware signature.
   *
   */
  signature?: string;
}

/**
 * This field indicates whether the Charging Station was able to accept the request.
 *
 *
 */
export type UpdateFirmwareStatusEnumType =
  | "Accepted"
  | "Rejected"
  | "AcceptedCanceled"
  | "InvalidCertificate"
  | "RevokedCertificate";

export interface UpdateFirmwareResponse {
  customData?: CustomDataType;
  status: UpdateFirmwareStatusEnumType;
  statusInfo?: StatusInfoType;
}
/**
 * This class does not get 'AdditionalProperties = false' in the schema generation, so it can be extended with arbitrary JSON properties to allow adding custom data.
 */
export interface CustomDataType {
  vendorId: string;
  [k: string]: unknown;
}
/**
 * Element providing more information about the status.
 *
 */
export interface StatusInfoType {
  customData?: CustomDataType;
  /**
   * A predefined code for the reason why the status is returned in this response. The string is case-insensitive.
   *
   */
  reasonCode: string;
  /**
   * Additional text to provide detailed information.
   *
   */
  additionalInfo?: string;
}

export interface OCPP2_0_1Methods {
  Authorize: {req: AuthorizeRequest, conf: AuthorizeResponse};
  BootNotification: {req: BootNotificationRequest, conf: BootNotificationResponse};
  CancelReservation: {req: CancelReservationRequest, conf: CancelReservationResponse};
  CertificateSigned: {req: CertificateSignedRequest, conf: CertificateSignedResponse};
  ChangeAvailability: {req: ChangeAvailabilityRequest, conf: ChangeAvailabilityResponse};
  ClearCache: {req: ClearCacheRequest, conf: ClearCacheResponse};
  ClearChargingProfile: {req: ClearChargingProfileRequest, conf: ClearChargingProfileResponse};
  ClearDisplayMessage: {req: ClearDisplayMessageRequest, conf: ClearDisplayMessageResponse};
  ClearedChargingLimit: {req: ClearedChargingLimitRequest, conf: ClearedChargingLimitResponse};
  ClearVariableMonitoring: {req: ClearVariableMonitoringRequest, conf: ClearVariableMonitoringResponse};
  CostUpdated: {req: CostUpdatedRequest, conf: CostUpdatedResponse};
  CustomerInformation: {req: CustomerInformationRequest, conf: CustomerInformationResponse};
  DataTransfer: {req: DataTransferRequest, conf: DataTransferResponse};
  DeleteCertificate: {req: DeleteCertificateRequest, conf: DeleteCertificateResponse};
  FirmwareStatusNotification: {req: FirmwareStatusNotificationRequest, conf: FirmwareStatusNotificationResponse};
  Get15118EVCertificate: {req: Get15118EVCertificateRequest, conf: Get15118EVCertificateResponse};
  GetBaseReport: {req: GetBaseReportRequest, conf: GetBaseReportResponse};
  GetCertificateStatus: {req: GetCertificateStatusRequest, conf: GetCertificateStatusResponse};
  GetChargingProfiles: {req: GetChargingProfilesRequest, conf: GetChargingProfilesResponse};
  GetCompositeSchedule: {req: GetCompositeScheduleRequest, conf: GetCompositeScheduleResponse};
  GetDisplayMessages: {req: GetDisplayMessagesRequest, conf: GetDisplayMessagesResponse};
  GetInstalledCertificateIds: {req: GetInstalledCertificateIdsRequest, conf: GetInstalledCertificateIdsResponse};
  GetLocalListVersion: {req: GetLocalListVersionRequest, conf: GetLocalListVersionResponse};
  GetLog: {req: GetLogRequest, conf: GetLogResponse};
  GetMonitoringReport: {req: GetMonitoringReportRequest, conf: GetMonitoringReportResponse};
  GetReport: {req: GetReportRequest, conf: GetReportResponse};
  GetTransactionStatus: {req: GetTransactionStatusRequest, conf: GetTransactionStatusResponse};
  GetVariables: {req: GetVariablesRequest, conf: GetVariablesResponse};
  Heartbeat: {req: HeartbeatRequest, conf: HeartbeatResponse};
  InstallCertificate: {req: InstallCertificateRequest, conf: InstallCertificateResponse};
  LogStatusNotification: {req: LogStatusNotificationRequest, conf: LogStatusNotificationResponse};
  MeterValues: {req: MeterValuesRequest, conf: MeterValuesResponse};
  NotifyChargingLimit: {req: NotifyChargingLimitRequest, conf: NotifyChargingLimitResponse};
  NotifyCustomerInformation: {req: NotifyCustomerInformationRequest, conf: NotifyCustomerInformationResponse};
  NotifyDisplayMessages: {req: NotifyDisplayMessagesRequest, conf: NotifyDisplayMessagesResponse};
  NotifyEVChargingNeeds: {req: NotifyEVChargingNeedsRequest, conf: NotifyEVChargingNeedsResponse};
  NotifyEVChargingSchedule: {req: NotifyEVChargingScheduleRequest, conf: NotifyEVChargingScheduleResponse};
  NotifyEvent: {req: NotifyEventRequest, conf: NotifyEventResponse};
  NotifyMonitoringReport: {req: NotifyMonitoringReportRequest, conf: NotifyMonitoringReportResponse};
  NotifyReport: {req: NotifyReportRequest, conf: NotifyReportResponse};
  PublishFirmware: {req: PublishFirmwareRequest, conf: PublishFirmwareResponse};
  PublishFirmwareStatusNotification: {req: PublishFirmwareStatusNotificationRequest, conf: PublishFirmwareStatusNotificationResponse};
  ReportChargingProfiles: {req: ReportChargingProfilesRequest, conf: ReportChargingProfilesResponse};
  RequestStartTransaction: {req: RequestStartTransactionRequest, conf: RequestStartTransactionResponse};
  RequestStopTransaction: {req: RequestStopTransactionRequest, conf: RequestStopTransactionResponse};
  ReservationStatusUpdate: {req: ReservationStatusUpdateRequest, conf: ReservationStatusUpdateResponse};
  ReserveNow: {req: ReserveNowRequest, conf: ReserveNowResponse};
  Reset: {req: ResetRequest, conf: ResetResponse};
  SecurityEventNotification: {req: SecurityEventNotificationRequest, conf: SecurityEventNotificationResponse};
  SendLocalList: {req: SendLocalListRequest, conf: SendLocalListResponse};
  SetChargingProfile: {req: SetChargingProfileRequest, conf: SetChargingProfileResponse};
  SetDisplayMessage: {req: SetDisplayMessageRequest, conf: SetDisplayMessageResponse};
  SetMonitoringBase: {req: SetMonitoringBaseRequest, conf: SetMonitoringBaseResponse};
  SetMonitoringLevel: {req: SetMonitoringLevelRequest, conf: SetMonitoringLevelResponse};
  SetNetworkProfile: {req: SetNetworkProfileRequest, conf: SetNetworkProfileResponse};
  SetVariableMonitoring: {req: SetVariableMonitoringRequest, conf: SetVariableMonitoringResponse};
  SetVariables: {req: SetVariablesRequest, conf: SetVariablesResponse};
  SignCertificate: {req: SignCertificateRequest, conf: SignCertificateResponse};
  StatusNotification: {req: StatusNotificationRequest, conf: StatusNotificationResponse};
  TransactionEvent: {req: TransactionEventRequest, conf: TransactionEventResponse};
  TriggerMessage: {req: TriggerMessageRequest, conf: TriggerMessageResponse};
  UnlockConnector: {req: UnlockConnectorRequest, conf: UnlockConnectorResponse};
  UnpublishFirmware: {req: UnpublishFirmwareRequest, conf: UnpublishFirmwareResponse};
  UpdateFirmware: {req: UpdateFirmwareRequest, conf: UpdateFirmwareResponse};
}