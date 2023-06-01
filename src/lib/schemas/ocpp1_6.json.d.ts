export interface AuthorizeRequest {
  idTag: string;
}

export interface AuthorizeResponse {
  idTagInfo: {
    expiryDate?: string;
    parentIdTag?: string;
    status: "Accepted" | "Blocked" | "Expired" | "Invalid" | "ConcurrentTx";
  };
}

export interface BootNotificationRequest {
  chargePointVendor: string;
  chargePointModel: string;
  chargePointSerialNumber?: string;
  chargeBoxSerialNumber?: string;
  firmwareVersion?: string;
  iccid?: string;
  imsi?: string;
  meterType?: string;
  meterSerialNumber?: string;
}

export interface BootNotificationResponse {
  status: "Accepted" | "Pending" | "Rejected";
  currentTime: string;
  interval: number;
}

export interface CancelReservationRequest {
  reservationId: number;
}

export interface CancelReservationResponse {
  status: "Accepted" | "Rejected";
}

export interface CertificateSignedRequest {
  certificateChain: string;
}

export type CertificateSignedStatusEnumType = "Accepted" | "Rejected";

export interface CertificateSignedResponse {
  status: CertificateSignedStatusEnumType;
}

export interface ChangeAvailabilityRequest {
  connectorId: number;
  type: "Inoperative" | "Operative";
}

export interface ChangeAvailabilityResponse {
  status: "Accepted" | "Rejected" | "Scheduled";
}

export interface ChangeConfigurationRequest {
  key: string;
  value: string;
}

export interface ChangeConfigurationResponse {
  status: "Accepted" | "Rejected" | "RebootRequired" | "NotSupported";
}

export interface ClearCacheRequest {}

export interface ClearCacheResponse {
  status: "Accepted" | "Rejected";
}

export interface ClearChargingProfileRequest {
  id?: number;
  connectorId?: number;
  chargingProfilePurpose?: "ChargePointMaxProfile" | "TxDefaultProfile" | "TxProfile";
  stackLevel?: number;
}

export interface ClearChargingProfileResponse {
  status: "Accepted" | "Unknown";
}

export interface DataTransferRequest {
  vendorId: string;
  messageId?: string;
  data?: string;
}

export interface DataTransferResponse {
  status: "Accepted" | "Rejected" | "UnknownMessageId" | "UnknownVendorId";
  data?: string;
}

export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";

export interface DeleteCertificateRequest {
  certificateHashData: CertificateHashDataType;
}
export interface CertificateHashDataType {
  hashAlgorithm: HashAlgorithmEnumType;
  issuerNameHash: string;
  issuerKeyHash: string;
  serialNumber: string;
}

export type DeleteCertificateStatusEnumType = "Accepted" | "Failed" | "NotFound";

export interface DeleteCertificateResponse {
  status: DeleteCertificateStatusEnumType;
}

export interface DiagnosticsStatusNotificationRequest {
  status: "Idle" | "Uploaded" | "UploadFailed" | "Uploading";
}

export interface DiagnosticsStatusNotificationResponse {}

export type MessageTriggerEnumType =
  | "BootNotification"
  | "LogStatusNotification"
  | "FirmwareStatusNotification"
  | "Heartbeat"
  | "MeterValues"
  | "SignChargePointCertificate"
  | "StatusNotification";

export interface ExtendedTriggerMessageRequest {
  requestedMessage: MessageTriggerEnumType;
  connectorId?: number;
}

export type TriggerMessageStatusEnumType = "Accepted" | "Rejected" | "NotImplemented";

export interface ExtendedTriggerMessageResponse {
  status: TriggerMessageStatusEnumType;
}

export interface FirmwareStatusNotificationRequest {
  status: "Downloaded" | "DownloadFailed" | "Downloading" | "Idle" | "InstallationFailed" | "Installing" | "Installed";
}

export interface FirmwareStatusNotificationResponse {}

export interface GetCompositeScheduleRequest {
  connectorId: number;
  duration: number;
  chargingRateUnit?: "A" | "W";
}

export interface GetCompositeScheduleResponse {
  status: "Accepted" | "Rejected";
  connectorId?: number;
  scheduleStart?: string;
  chargingSchedule?: {
    duration?: number;
    startSchedule?: string;
    chargingRateUnit: "A" | "W";
    chargingSchedulePeriod: {
      startPeriod: number;
      limit: number;
      numberPhases?: number;
    }[];
    minChargingRate?: number;
  };
}

export interface GetConfigurationRequest {
  key?: string[];
}

export interface GetConfigurationResponse {
  configurationKey?: {
    key: string;
    readonly: boolean;
    value?: string;
  }[];
  unknownKey?: string[];
}

export interface GetDiagnosticsRequest {
  location: string;
  retries?: number;
  retryInterval?: number;
  startTime?: string;
  stopTime?: string;
}

export interface GetDiagnosticsResponse {
  fileName?: string;
}

export type CertificateUseEnumType = "CentralSystemRootCertificate" | "ManufacturerRootCertificate";

export interface GetInstalledCertificateIdsRequest {
  certificateType: CertificateUseEnumType;
}

export type HashAlgorithmEnumType = "SHA256" | "SHA384" | "SHA512";
export type GetInstalledCertificateStatusEnumType = "Accepted" | "NotFound";

export interface GetInstalledCertificateIdsResponse {
  /**
   * @minItems 1
   */
  certificateHashData?: CertificateHashDataType[];
  status: GetInstalledCertificateStatusEnumType;
}
export interface CertificateHashDataType {
  hashAlgorithm: HashAlgorithmEnumType;
  issuerNameHash: string;
  issuerKeyHash: string;
  serialNumber: string;
}

export interface GetLocalListVersionRequest {}

export interface GetLocalListVersionResponse {
  listVersion: number;
}

export type LogEnumType = "DiagnosticsLog" | "SecurityLog";

export interface GetLogRequest {
  log: LogParametersType;
  logType: LogEnumType;
  requestId: number;
  retries?: number;
  retryInterval?: number;
}
export interface LogParametersType {
  remoteLocation: string;
  oldestTimestamp?: string;
  latestTimestamp?: string;
}

export type LogStatusEnumType = "Accepted" | "Rejected" | "AcceptedCanceled";

export interface GetLogResponse {
  status: LogStatusEnumType;
  filename?: string;
}

export interface HeartbeatRequest {}

export interface HeartbeatResponse {
  currentTime: string;
}

export type CertificateUseEnumType = "CentralSystemRootCertificate" | "ManufacturerRootCertificate";

export interface InstallCertificateRequest {
  certificateType: CertificateUseEnumType;
  certificate: string;
}

export type InstallCertificateStatusEnumType = "Accepted" | "Failed" | "Rejected";

export interface InstallCertificateResponse {
  status: InstallCertificateStatusEnumType;
}

export type UploadLogStatusEnumType =
  | "BadMessage"
  | "Idle"
  | "NotSupportedOperation"
  | "PermissionDenied"
  | "Uploaded"
  | "UploadFailure"
  | "Uploading";

export interface LogStatusNotificationRequest {
  status: UploadLogStatusEnumType;
  requestId?: number;
}

export interface LogStatusNotificationResponse {}

export interface MeterValuesRequest {
  connectorId: number;
  transactionId?: number;
  meterValue: {
    timestamp: string;
    sampledValue: {
      value: string;
      context?:
        | "Interruption.Begin"
        | "Interruption.End"
        | "Sample.Clock"
        | "Sample.Periodic"
        | "Transaction.Begin"
        | "Transaction.End"
        | "Trigger"
        | "Other";
      format?: "Raw" | "SignedData";
      measurand?:
        | "Energy.Active.Export.Register"
        | "Energy.Active.Import.Register"
        | "Energy.Reactive.Export.Register"
        | "Energy.Reactive.Import.Register"
        | "Energy.Active.Export.Interval"
        | "Energy.Active.Import.Interval"
        | "Energy.Reactive.Export.Interval"
        | "Energy.Reactive.Import.Interval"
        | "Power.Active.Export"
        | "Power.Active.Import"
        | "Power.Offered"
        | "Power.Reactive.Export"
        | "Power.Reactive.Import"
        | "Power.Factor"
        | "Current.Import"
        | "Current.Export"
        | "Current.Offered"
        | "Voltage"
        | "Frequency"
        | "Temperature"
        | "SoC"
        | "RPM";
      phase?: "L1" | "L2" | "L3" | "N" | "L1-N" | "L2-N" | "L3-N" | "L1-L2" | "L2-L3" | "L3-L1";
      location?: "Cable" | "EV" | "Inlet" | "Outlet" | "Body";
      unit?:
        | "Wh"
        | "kWh"
        | "varh"
        | "kvarh"
        | "W"
        | "kW"
        | "VA"
        | "kVA"
        | "var"
        | "kvar"
        | "A"
        | "V"
        | "K"
        | "Celcius"
        | "Celsius"
        | "Fahrenheit"
        | "Percent";
    }[];
  }[];
}

export interface MeterValuesResponse {}

export interface RemoteStartTransactionRequest {
  connectorId?: number;
  idTag: string;
  chargingProfile?: {
    chargingProfileId: number;
    transactionId?: number;
    stackLevel: number;
    chargingProfilePurpose: "ChargePointMaxProfile" | "TxDefaultProfile" | "TxProfile";
    chargingProfileKind: "Absolute" | "Recurring" | "Relative";
    recurrencyKind?: "Daily" | "Weekly";
    validFrom?: string;
    validTo?: string;
    chargingSchedule: {
      duration?: number;
      startSchedule?: string;
      chargingRateUnit: "A" | "W";
      chargingSchedulePeriod: {
        startPeriod: number;
        limit: number;
        numberPhases?: number;
      }[];
      minChargingRate?: number;
    };
  };
}

export interface RemoteStartTransactionResponse {
  status: "Accepted" | "Rejected";
}

export interface RemoteStopTransactionRequest {
  transactionId: number;
}

export interface RemoteStopTransactionResponse {
  status: "Accepted" | "Rejected";
}

export interface ReserveNowRequest {
  connectorId: number;
  expiryDate: string;
  idTag: string;
  parentIdTag?: string;
  reservationId: number;
}

export interface ReserveNowResponse {
  status: "Accepted" | "Faulted" | "Occupied" | "Rejected" | "Unavailable";
}

export interface ResetRequest {
  type: "Hard" | "Soft";
}

export interface ResetResponse {
  status: "Accepted" | "Rejected";
}

export interface SecurityEventNotificationRequest {
  type: string;
  timestamp: string;
  techInfo?: string;
}

export interface SecurityEventNotificationResponse {}

export interface SendLocalListRequest {
  listVersion: number;
  localAuthorizationList?: {
    idTag: string;
    idTagInfo?: {
      expiryDate?: string;
      parentIdTag?: string;
      status: "Accepted" | "Blocked" | "Expired" | "Invalid" | "ConcurrentTx";
    };
  }[];
  updateType: "Differential" | "Full";
}

export interface SendLocalListResponse {
  status: "Accepted" | "Failed" | "NotSupported" | "VersionMismatch";
}

export interface SetChargingProfileRequest {
  connectorId: number;
  csChargingProfiles: {
    chargingProfileId: number;
    transactionId?: number;
    stackLevel: number;
    chargingProfilePurpose: "ChargePointMaxProfile" | "TxDefaultProfile" | "TxProfile";
    chargingProfileKind: "Absolute" | "Recurring" | "Relative";
    recurrencyKind?: "Daily" | "Weekly";
    validFrom?: string;
    validTo?: string;
    chargingSchedule: {
      duration?: number;
      startSchedule?: string;
      chargingRateUnit: "A" | "W";
      chargingSchedulePeriod: {
        startPeriod: number;
        limit: number;
        numberPhases?: number;
      }[];
      minChargingRate?: number;
    };
  };
}

export interface SetChargingProfileResponse {
  status: "Accepted" | "Rejected" | "NotSupported";
}

export interface SignCertificateRequest {
  csr: string;
}

export type GenericStatusEnumType = "Accepted" | "Rejected";

export interface SignCertificateResponse {
  status: GenericStatusEnumType;
}

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

export interface SignedFirmwareStatusNotificationRequest {
  status: FirmwareStatusEnumType;
  requestId?: number;
}

export interface SignedFirmwareStatusNotificationResponse {}

export interface SignedUpdateFirmwareRequest {
  retries?: number;
  retryInterval?: number;
  requestId: number;
  firmware: FirmwareType;
}
export interface FirmwareType {
  location: string;
  retrieveDateTime: string;
  installDateTime?: string;
  signingCertificate: string;
  signature: string;
}

export type UpdateFirmwareStatusEnumType =
  | "Accepted"
  | "Rejected"
  | "AcceptedCanceled"
  | "InvalidCertificate"
  | "RevokedCertificate";

export interface SignedUpdateFirmwareResponse {
  status: UpdateFirmwareStatusEnumType;
}

export interface StartTransactionRequest {
  connectorId: number;
  idTag: string;
  meterStart: number;
  reservationId?: number;
  timestamp: string;
}

export interface StartTransactionResponse {
  idTagInfo: {
    expiryDate?: string;
    parentIdTag?: string;
    status: "Accepted" | "Blocked" | "Expired" | "Invalid" | "ConcurrentTx";
  };
  transactionId: number;
}

export interface StatusNotificationRequest {
  connectorId: number;
  errorCode:
    | "ConnectorLockFailure"
    | "EVCommunicationError"
    | "GroundFailure"
    | "HighTemperature"
    | "InternalError"
    | "LocalListConflict"
    | "NoError"
    | "OtherError"
    | "OverCurrentFailure"
    | "PowerMeterFailure"
    | "PowerSwitchFailure"
    | "ReaderFailure"
    | "ResetFailure"
    | "UnderVoltage"
    | "OverVoltage"
    | "WeakSignal";
  info?: string;
  status:
    | "Available"
    | "Preparing"
    | "Charging"
    | "SuspendedEVSE"
    | "SuspendedEV"
    | "Finishing"
    | "Reserved"
    | "Unavailable"
    | "Faulted";
  timestamp?: string;
  vendorId?: string;
  vendorErrorCode?: string;
}

export interface StatusNotificationResponse {}

export interface StopTransactionRequest {
  idTag?: string;
  meterStop: number;
  timestamp: string;
  transactionId: number;
  reason?:
    | "EmergencyStop"
    | "EVDisconnected"
    | "HardReset"
    | "Local"
    | "Other"
    | "PowerLoss"
    | "Reboot"
    | "Remote"
    | "SoftReset"
    | "UnlockCommand"
    | "DeAuthorized";
  transactionData?: {
    timestamp: string;
    sampledValue: {
      value: string;
      context?:
        | "Interruption.Begin"
        | "Interruption.End"
        | "Sample.Clock"
        | "Sample.Periodic"
        | "Transaction.Begin"
        | "Transaction.End"
        | "Trigger"
        | "Other";
      format?: "Raw" | "SignedData";
      measurand?:
        | "Energy.Active.Export.Register"
        | "Energy.Active.Import.Register"
        | "Energy.Reactive.Export.Register"
        | "Energy.Reactive.Import.Register"
        | "Energy.Active.Export.Interval"
        | "Energy.Active.Import.Interval"
        | "Energy.Reactive.Export.Interval"
        | "Energy.Reactive.Import.Interval"
        | "Power.Active.Export"
        | "Power.Active.Import"
        | "Power.Offered"
        | "Power.Reactive.Export"
        | "Power.Reactive.Import"
        | "Power.Factor"
        | "Current.Import"
        | "Current.Export"
        | "Current.Offered"
        | "Voltage"
        | "Frequency"
        | "Temperature"
        | "SoC"
        | "RPM";
      phase?: "L1" | "L2" | "L3" | "N" | "L1-N" | "L2-N" | "L3-N" | "L1-L2" | "L2-L3" | "L3-L1";
      location?: "Cable" | "EV" | "Inlet" | "Outlet" | "Body";
      unit?:
        | "Wh"
        | "kWh"
        | "varh"
        | "kvarh"
        | "W"
        | "kW"
        | "VA"
        | "kVA"
        | "var"
        | "kvar"
        | "A"
        | "V"
        | "K"
        | "Celcius"
        | "Celsius"
        | "Fahrenheit"
        | "Percent";
    }[];
  }[];
}

export interface StopTransactionResponse {
  idTagInfo?: {
    expiryDate?: string;
    parentIdTag?: string;
    status: "Accepted" | "Blocked" | "Expired" | "Invalid" | "ConcurrentTx";
  };
}

export interface TriggerMessageRequest {
  requestedMessage:
    | "BootNotification"
    | "DiagnosticsStatusNotification"
    | "FirmwareStatusNotification"
    | "Heartbeat"
    | "MeterValues"
    | "StatusNotification";
  connectorId?: number;
}

export interface TriggerMessageResponse {
  status: "Accepted" | "Rejected" | "NotImplemented";
}

export interface UnlockConnectorRequest {
  connectorId: number;
}

export interface UnlockConnectorResponse {
  status: "Unlocked" | "UnlockFailed" | "NotSupported";
}

export interface UpdateFirmwareRequest {
  location: string;
  retries?: number;
  retrieveDate: string;
  retryInterval?: number;
}

export interface UpdateFirmwareResponse {}

export interface OCPP1_6Methods {
  Authorize: {req: AuthorizeRequest, conf: AuthorizeResponse};
  BootNotification: {req: BootNotificationRequest, conf: BootNotificationResponse};
  CancelReservation: {req: CancelReservationRequest, conf: CancelReservationResponse};
  CertificateSigned: {req: CertificateSignedRequest, conf: CertificateSignedResponse};
  ChangeAvailability: {req: ChangeAvailabilityRequest, conf: ChangeAvailabilityResponse};
  ChangeConfiguration: {req: ChangeConfigurationRequest, conf: ChangeConfigurationResponse};
  ClearCache: {req: ClearCacheRequest, conf: ClearCacheResponse};
  ClearChargingProfile: {req: ClearChargingProfileRequest, conf: ClearChargingProfileResponse};
  DataTransfer: {req: DataTransferRequest, conf: DataTransferResponse};
  DeleteCertificate: {req: DeleteCertificateRequest, conf: DeleteCertificateResponse};
  DiagnosticsStatusNotification: {req: DiagnosticsStatusNotificationRequest, conf: DiagnosticsStatusNotificationResponse};
  ExtendedTriggerMessage: {req: ExtendedTriggerMessageRequest, conf: ExtendedTriggerMessageResponse};
  FirmwareStatusNotification: {req: FirmwareStatusNotificationRequest, conf: FirmwareStatusNotificationResponse};
  GetCompositeSchedule: {req: GetCompositeScheduleRequest, conf: GetCompositeScheduleResponse};
  GetConfiguration: {req: GetConfigurationRequest, conf: GetConfigurationResponse};
  GetDiagnostics: {req: GetDiagnosticsRequest, conf: GetDiagnosticsResponse};
  GetInstalledCertificateIds: {req: GetInstalledCertificateIdsRequest, conf: GetInstalledCertificateIdsResponse};
  GetLocalListVersion: {req: GetLocalListVersionRequest, conf: GetLocalListVersionResponse};
  GetLog: {req: GetLogRequest, conf: GetLogResponse};
  Heartbeat: {req: HeartbeatRequest, conf: HeartbeatResponse};
  InstallCertificate: {req: InstallCertificateRequest, conf: InstallCertificateResponse};
  LogStatusNotification: {req: LogStatusNotificationRequest, conf: LogStatusNotificationResponse};
  MeterValues: {req: MeterValuesRequest, conf: MeterValuesResponse};
  RemoteStartTransaction: {req: RemoteStartTransactionRequest, conf: RemoteStartTransactionResponse};
  RemoteStopTransaction: {req: RemoteStopTransactionRequest, conf: RemoteStopTransactionResponse};
  ReserveNow: {req: ReserveNowRequest, conf: ReserveNowResponse};
  Reset: {req: ResetRequest, conf: ResetResponse};
  SecurityEventNotification: {req: SecurityEventNotificationRequest, conf: SecurityEventNotificationResponse};
  SendLocalList: {req: SendLocalListRequest, conf: SendLocalListResponse};
  SetChargingProfile: {req: SetChargingProfileRequest, conf: SetChargingProfileResponse};
  SignCertificate: {req: SignCertificateRequest, conf: SignCertificateResponse};
  SignedFirmwareStatusNotification: {req: SignedFirmwareStatusNotificationRequest, conf: SignedFirmwareStatusNotificationResponse};
  SignedUpdateFirmware: {req: SignedUpdateFirmwareRequest, conf: SignedUpdateFirmwareResponse};
  StartTransaction: {req: StartTransactionRequest, conf: StartTransactionResponse};
  StatusNotification: {req: StatusNotificationRequest, conf: StatusNotificationResponse};
  StopTransaction: {req: StopTransactionRequest, conf: StopTransactionResponse};
  TriggerMessage: {req: TriggerMessageRequest, conf: TriggerMessageResponse};
  UnlockConnector: {req: UnlockConnectorRequest, conf: UnlockConnectorResponse};
  UpdateFirmware: {req: UpdateFirmwareRequest, conf: UpdateFirmwareResponse};
}