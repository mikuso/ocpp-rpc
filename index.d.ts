import EventEmitter from "events";

type RPCClientOptions = {
  endpoint?: string;
  password?: string | null;
  callTimeoutMs?: number;
  pingIntervalMs?: number;
  deferPingsOnActivity?: boolean;
  wsOpts?: any;
  headers?: any;
  protocols?: Array<string>;
  reconnect?: boolean;
  maxReconnects?: number;
  respondWithDetailedErrors?: boolean;
  callConcurrency?: number;
  maxBadMessages?: number;
  strictMode?: boolean;
  strictModeValidators?: Array<string>;
  backoff?: {
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    randomisationFactor?: number;
  };
};

export declare class RPCClient extends EventEmitter {
  constructor(options: RPCClientOptions);
  get identity(): string;
  get protocol(): string;
  get state(): string;

  reconfigure(options: RPCClientOptions): void;
  connect(): Promise<void>;
  sendRaw(message: string): void;
  close(options: {
    code: string;
    reason: string;
    awaitPending: boolean;
    force: boolean;
  }): void;
  call<OPERATION extends Message>(
    method: OPERATION,
    params: RpcFunctionsReq<OPERATION>,
    options?: { callTimeoutMs: number; signal: AbortSignal; noReply: boolean }
  ): Promise<RpcFunctionsConf<OPERATION>>;
  on<T extends RPCClientEvent>(
    eventName: RPCClientEvent,
    listener: RPCClientEventListener<T>
  ): this;
  handle<OPERATION extends Message>(
    method: OPERATION,
    handler: RPCCallback<OPERATION>
  ): void;
  handle<OPERATION extends Message>(handler: RPCCallback<OPERATION>): void;
  removeHandler<OPERATION extends Message>(
    method: OPERATION,
    handler: RPCCallback<OPERATION>
  ): void;
  removeHandler<OPERATION extends Message>(
    handler: RPCCallback<OPERATION>
  ): void;
  removeAllHandlers(): void;
}

// lib/server.js
type RPCClientEvent = "client";
type RPCClientEventListenerArgs<T extends RPCClientEvent> = T extends "client"
  ? RPCClient
  : any;
type RPCClientEventListener<T extends RPCClientEvent> = (
  args: RPCClientEventListenerArgs<T>
) => void;

export declare class RPCServer extends RPCClient {
  listen(
    port: number,
    host?: string,
    options?: { signal: AbortController["signal"] }
  ): void;
  auth(accept: (arg0: any) => void);
}

// lib/util.js
export declare function getPackageIdent(): string;
export declare function getErrorPlainObject(err: Error): string;
export declare function createRPCError(
  type?: string,
  message?: string,
  details?: any
);

/**
 * Elements that constitute an entry of a Local Authorization List update.
 */
export type AuthorizationData = {
  /** Required. The identifier to which this authorization applies. */
  idTag: IdToken;
  /** Optional. (Required when UpdateType is Full) This contains information about authorization status, expiry and parent id. For a Differential update the following applies: If this element is present, then this entry SHALL be added or updated in the Local Authorization List. If this element is absent, than the entry for this idtag in the Local Authorization List SHALL be deleted. */
  idTagInfo: IdTagInfo;
};

/**
 * Status in a response to an Authorize.req.
 */
export const enum AuthorizationStatus {
  /** Identifier is allowed for charging. */
  Accepted = "Accepted",
  /** Identifier has been blocked. Not allowed for charging. */
  Blocked = "Blocked",
  /** Identifier has expired. Not allowed for charging. */
  Expired = "Expired",
  /** Identifier is unknown. Not allowed for charging. */
  Invalid = "Invalid",
  /** Identifier is already involved in another transaction and multiple transactions are not allowed. (Only relevant for a StartTransaction.req.) */
  ConcurrentTx = "ConcurrentTx",
}

/**
 * Status returned in response to ChangeAvailability.req.
 */
export const enum AvailabilityStatus {
  /** Request has been accepted and will be executed. */
  Accepted = "Accepted",
  /** Request has not been accepted and will not be executed. */
  Rejected = "Rejected",
  /** Request has been accepted and will be executed when transaction(s) in progress have finished. */
  Scheduled = "Scheduled",
}

/**
 * Requested availability change in ChangeAvailability.req.
 */
export const enum AvailabilityType {
  /** Charge point is not available for charging. */
  Inoperative = "Inoperative",
  /** Charge point is available for charging. */
  Operative = "Operative",
}

/**
 * Status in CancelReservation.conf.
 */
export const enum CancelReservationStatus {
  /** Reservation for the identifier has been cancelled. */
  Accepted = "Accepted",
  /** Reservation could not be cancelled, because there is no reservation active for the identifier. */
  Rejected = "Rejected",
}

/**
 * Charge Point status reported in StatusNotification.req.
 */
export const enum ChargePointErrorCode {
  /** Failure to lock or unlock connector. */
  ConnectorLockFailure = "ConnectorLockFailure",
  /** Communication failure with the vehicle, might be Mode 3 or other communication protocol problem. This is not a real error in the sense that the Charge Point doesn’t need to go to the faulted state. Instead, it should go to the SuspendedEVSE state. */
  EVCommunicationError = "EVCommunicationError",
  /** Ground fault circuit interrupter has been activated. */
  GroundFailure = "GroundFailure",
  /** Temperature inside Charge Point is too high. */
  HighTemperature = "HighTemperature",
  /** Error in internal hard- or software component. */
  InternalError = "InternalError",
  /** The authorization information received from the Central System is in conflict with the LocalAuthorizationList. */
  LocalListConflict = "LocalListConflict",
  /** No error to report. */
  NoError = "NoError",
  /** Other type of error. More information in vendorErrorCode. */
  OtherError = "OtherError",
  /** Over current protection device has tripped. */
  OverCurrentFailure = "OverCurrentFailure",
  /** Voltage has risen above an acceptable level. */
  OverVoltage = "OverVoltage",
  /** Failure to read electrical/energy/power meter. */
  PowerMeterFailure = "PowerMeterFailure",
  /** Failure to control power switch. */
  PowerSwitchFailure = "PowerSwitchFailure",
  /** Failure with idTag reader. */
  ReaderFailure = "ReaderFailure",
  /** Unable to perform a reset. */
  ResetFailure = "ResetFailure",
  /** Voltage has dropped below an acceptable level. */
  UnderVoltage = "UnderVoltage",
  /** Wireless communication device reports a weak signal. */
  WeakSignal = "WeakSignal",
}

/**
 * Status reported in StatusNotification.req. A status can be reported for the Charge Point main controller (connectorId = 0) or for a specific connector. Status for the Charge Point main controller is a subset of the enumeration: Available, Unavailable or Faulted.
 *
 * States considered Operative are: Available, Preparing, Charging, SuspendedEVSE, SuspendedEV, Finishing, Reserved.
 *
 * States considered Inoperative are: Unavailable, Faulted.
 */
export const enum ChargePointStatus {
  /** When a Connector becomes available for a new user (Operative) */
  Available = "Available",
  /** When a Connector becomes no longer available for a new user but there is no ongoing Transaction (yet). Typically a Connector is in preparing state when a user presents a tag, inserts a cable or a vehicle occupies the parking bay (Operative) */
  Preparing = "Preparing",
  /** When the contactor of a Connector closes, allowing the vehicle to charge (Operative) */
  Charging = "Charging",
  /** When the EV is connected to the EVSE but the EVSE is not offering energy to the EV, e.g. due to a smart charging restriction, local supply power constraints, or as the result of StartTransaction.conf indicating that charging is not allowed etc. (Operative) */
  SuspendedEVSE = "SuspendedEVSE",
  /** When the EV is connected to the EVSE and the EVSE is offering energy but the EV is not taking any energy. (Operative) */
  SuspendedEV = "SuspendedEV",
  /** When a Transaction has stopped at a Connector, but the Connector is not yet available for a new user, e.g. the cable has not been removed or the vehicle has not left the parking bay (Operative) */
  Finishing = "Finishing",
  /** When a Connector becomes reserved as a result of a Reserve Now command (Operative) */
  Reserved = "Reserved",
  /** When a Connector becomes unavailable as the result of a Change Availability command or an event upon which the Charge Point transitions to unavailable at its discretion. Upon receipt of a Change Availability command, the status MAY change immediately or the change MAY be scheduled. When scheduled, the Status Notification shall be send when the availability change becomes effective (Inoperative) */
  Unavailable = "Unavailable",
  /** When a Charge Point or connector has reported an error and is not available for energy delivery . (Inoperative). */
  Faulted = "Faulted",
}

/**
 * A ChargingProfile consists of a ChargingSchedule, describing the amount of power or current that can be delivered per time interval.
 */
export type ChargingProfile = {
  /** Required. Unique identifier for this profile. */
  chargingProfileId: number;
  /**  Optional. Only valid if ChargingProfilePurpose is set to TxProfile, the transactionId MAY be used to match the profile to a specific transaction. */
  transactionId?: number;
  /** Required. Value determining level in hierarchy stack of profiles. Higher values have precedence over lower values. Lowest level is 0. */
  stackLevel: number;
  /** Required. Defines the purpose of the schedule transferred by this message. */
  chargingProfilePurpose: ChargingProfilePurposeType;
  /** Required. Indicates the kind of schedule. */
  chargingProfileKind: ChargingProfileKindType;
  /** Optional. Indicates the start point of a recurrence. */
  recurrencyKind?: RecurrencyKindType;
  /** Optional. Point in time at which the profile starts to be valid. If absent, the profile is valid as soon as it is received by the Charge Point. */
  validFrom?: string | Date;
  /** Optional. Point in time at which the profile starts to be valid. If absent, the profile is valid as soon as it is received by the Charge Point. */
  validTo?: string | Date;
  /** Required. Contains limits for the available power or current over time. */
  chargingSchedule: ChargingSchedule;
};

/**
 * Kind of charging profile, as used in: ChargingProfile.
 */
export const enum ChargingProfileKindType {
  /** Schedule periods are relative to a fixed point in time defined in the schedule. */
  Absolute = "Absolute",
  /** The schedule restarts periodically at the first schedule period. */
  Recurring = "Recurring",
  /** Schedule periods are relative to a situation-specific start point (such as the start of a Transaction) that is determined by the charge point. */
  Relative = "Relative",
}

/**
 * Purpose of the charging profile, as used in: ChargingProfile.
 */
export const enum ChargingProfilePurposeType {
  /** Configuration for the maximum power or current available for an entire Charge Point. */
  ChargePointMaxProfile = "ChargePointMaxProfile",
  /** Default profile *that can be configured in the Charge Point. When a new transaction is started, this profile SHALL be used, unless it was a transaction that was started by a RemoteStartTransaction.req with a ChargeProfile that is accepted by the Charge Point. */
  TxDefaultProfile = "TxDefaultProfile",
  /** Profile with constraints to be imposed by the Charge Point on the current transaction, or on a new transaction when this is started via a RemoteStartTransaction.req with a ChargeProfile. A profile with this purpose SHALL cease to be valid when the transaction terminates. */
  TxProfile = "TxProfile",
}

/**
 * Status returned in response to SetChargingProfile.req.
 */
export const enum ChargingProfileStatus {
  /** Request has been accepted and will be executed. */
  Accepted = "Accepted",
  /** Request has not been accepted and will not be executed. */
  Rejected = "Rejected",
  /** Charge Point indicates that the request is not supported. */
  NotSupported = "NotSupported",
}

/**
 * Unit in which a charging schedule is defined, as used in: GetCompositeSchedule.req and ChargingSchedule
 */
export const enum ChargingRateUnitType {
  /**
   * Watts (power).
   * This is the TOTAL allowed charging power.
   * If used for AC Charging, the phase current should be calculated via: Current per phase = Power / (Line Voltage * Number of Phases). The "Line Voltage" used in the calculation is not the measured voltage, but the set voltage for the area (hence, 230 of 110 volt). The "Number of Phases" is the numberPhases from the ChargingSchedulePeriod.
   * It is usually more convenient to use this for DC charging.
   * Note that if numberPhases in a ChargingSchedulePeriod is absent, 3 SHALL be assumed.
   */
  W = "W",
  /**
   * Amperes (current).
   * The amount of Ampere per phase, not the sum of all phases.
   * It is usually more convenient to use this for AC charging.
   */
  A = "A",
}

/**
 * Charging schedule structure defines a list of charging periods, as used in: GetCompositeSchedule.conf and ChargingProfile.
 */
export type ChargingSchedule = {
  /** Optional. Duration of the charging schedule in seconds. If the duration is left empty, the last period will continue indefinitely or until end of the transaction in case startSchedule is absent. */
  duration?: number;
  /** Optional. Starting point of an absolute schedule. If absent the schedule will be relative to start of charging. */
  startSchedule?: string | Date;
  /** Required. The unit of measure Limit is expressed in. */
  chargingRateUnit: ChargingRateUnitType;
  /** Required. List of ChargingSchedulePeriod elements defining maximum power or current usage over time. The startSchedule of the first ChargingSchedulePeriod SHALL always be 0. */
  chargingSchedulePeriod: Array<ChargingSchedulePeriod>;
  /** Optional. Minimum charging rate supported by the electric vehicle. The unit of measure is defined by the chargingRateUnit. This parameter is intended to be used by a local smart charging algorithm to optimize the power allocation for in the case a charging process is inefficient at lower charging rates. Accepts at most one digit fraction (e.g. 8.1) */
  minChargingRate: number;
};

/**
 * Charging schedule period structure defines a time period in a charging schedule, as used in: ChargingSchedule.
 */
export type ChargingSchedulePeriod = {
  /** Required. Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period. */
  startPeriod: number;
  /** Required. Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes or Watts. Accepts at most one digit fraction (e.g. 8.1). */
  limit: number;
  /** Optional. The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given. */
  numberPhases?: number;
};

export type CiString20Type = string;
export type CiString25Type = string;
export type CiString50Type = string;
export type CiString255Type = string;
export type CiString500Type = string;

/**
 * Status returned in response to ClearCache.req.
 */
export const enum ClearCacheStatus {
  /** Command has been executed. */
  Accepted = "Accepted",
  /** Command has not been executed. */
  Rejected = "Rejected",
}

/**
 * Status returned in response to ClearChargingProfile.req.
 */
export const enum ClearChargingProfileStatus {
  /** Request has been accepted and will be executed. */
  Accepted = "Accepted",
  /** No Charging Profile(s) were found matching the request. */
  Unknown = "Unknown",
}

/**
 * Status in ChangeConfiguration.conf.
 */
export const enum ConfigurationStatus {
  /**Configuration key is supported and setting has been changed.*/
  Accepted = "Accepted",
  /** Configuration key is supported, but setting could not be changed. */
  Rejected = "Rejected",
  /** Configuration key is supported and setting has been changed, but change will be available after reboot (Charge Point will not reboot itself) */
  RebootRequired = "RebootRequired",
  /** Configuration key is not supported. */
  NotSupported = "NotSupported",
}

/**
 * Status in DataTransfer.conf.
 */
export const enum DataTransferStatus {
  /** Message has been accepted and the contained request is accepted. */
  Accepted = "Accepted",
  /** Message has been accepted but the contained request is rejected. */
  Rejected = "Rejected",
  /** Message could not be interpreted due to unknown messageId string. */
  UnknownMessageId = "UnknownMessageId",
  /** Message could not be interpreted due to unknown vendorId string.*/
  UnknownVendorId = "UnknownVendorId",
}

/**
 * Status in DiagnosticsStatusNotification.req.
 */
export const enum DiagnosticsStatus {
  /** Charge Point is not performing diagnostics related tasks. Status Idle SHALL only be used as in a DiagnosticsStatusNotification.req that was triggered by a TriggerMessage.req */
  Idle = "Idle",
  /** Diagnostics information has been uploaded. */
  Uploaded = "Uploaded",
  /** Uploading of diagnostics failed. */
  UploadFailed = "UploadFailed",
  /** File is being uploaded. */
  Uploading = "Uploading",
}

/**
 * Status of a firmware download as reported in FirmwareStatusNotification.req.
 */
export const enum FirmwareStatus {
  /** New firmware has been downloaded by Charge Point. */
  Downloaded = "Downloaded",
  /** Charge point failed to download firmware. */
  DownloadFailed = "DownloadFailed",
  /** Firmware is being downloaded. */
  Downloading = "Downloading",
  /** Charge Point is not performing firmware update related tasks. Status Idle SHALL only be used as in a FirmwareStatusNotification.req that was triggered by a TriggerMessage.req */
  Idle = "Idle",
  /** Installation of new firmware has failed. */
  InstallationFailed = "InstallationFailed",
  /** Firmware is being installed. */
  Installing = "Installing",
  /** New firmware has successfully been installed in charge point. */
  Installed = "Installed",
}

/** Status returned in response to GetCompositeSchedule.req. */
export const enum GetCompositeScheduleStatus {
  /** Request has been accepted and will be executed. */
  Accepted = "Accepted",
  /** Request has not been accepted and will not be executed. */
  Rejected = "Rejected",
}

/** Contains status information about an identifier. It is returned in Authorize, Start Transaction and Stop Transaction responses.
If expiryDate is not given, the status has no end date. */
export type IdTagInfo = {
  /** Optional. This contains the date at which idTag should be removed from the Authorization Cache. */
  expiryDate?: string | Date;
  /** Optional. This contains the parent-identifier. */
  parentIdTag?: IdToken;
  /** Required. This contains whether the idTag has been accepted or not by the Central System. */
  status: AuthorizationStatus;
};

/** Contains the identifier to use for authorization. It is a case insensitive string. In future releases this may become a complex type to support multiple forms of identifiers. */
export type IdToken = CiString20Type;

/**
 * Contains information about a specific configuration key. It is returned in GetConfiguration.conf.
 */
export type KeyValue = {
  /** Required. */
  key: CiString50Type;
  /** Required. False if the value can be set with the ChangeConfiguration message. */
  readonly: boolean;
  /** Optional. If key is known but not set, this field may be absent. */
  value?: CiString500Type;
};

/**
 * Allowable values of the optional "location" field of a value element in SampledValue.
 */
export const enum Location {
  /** Measurement inside body of Charge Point (e.g. Temperature) */
  Body = "Body",
  /** Measurement taken from cable between EV and Charge Point */
  Cable = "Cable",
  /** Measurement taken by EV */
  EV = "EV",
  /** Measurement at network (“grid”) inlet connection */
  Inlet = "Inlet",
  /** Measurement at a Connector. Default value */
  Outlet = "Outlet",
}

/**
 * Allowable values of the optional "measurand" field of a Value element, as used in MeterValues.req and StopTransaction.req messages. Default value of "measurand" is always "Energy.Active.Import.Register"
 * Import is energy flow from the Grid to the Charge Point, EV or other load. Export is energy flow from the EV to the Charge Point and/or from the Charge Point to the Grid.
 */
export const enum Measurand {
  /** Instantaneous current flow from EV */
  "Current.Export" = "Current.Export",
  /** Instantaneous current flow to EV */
  "Current.Import" = "Current.Import",
  /** Maximum current offered to EV */
  "Current.Offered" = "Current.Offered",
  /** Numerical value read from the "active electrical energy" (Wh or kWh) register of the (most authoritative) electrical meter measuring energy exported (to the grid). */
  "Energy.Active.Export.Register" = "Energy.Active.Export.Register",
  /** Numerical value read from the "active electrical energy" (Wh or kWh) register of the (most authoritative) electrical meter measuring energy imported (from the grid supply). */
  "Energy.Active.Import.Register" = "Energy.Active.Import.Register",
  /** Numerical value read from the "reactive electrical energy" (VARh or kVARh) register of the (most authoritative) electrical meter measuring energy exported (to the grid). */
  "Energy.Reactive.Export.Register" = "Energy.Reactive.Export.Register",
  /** Numerical value read from the "reactive electrical energy" (VARh or kVARh) register of the (most authoritative) electrical meter measuring energy imported (from the grid supply). */
  "Energy.Reactive.Import.Register" = "Energy.Reactive.Import.Register",
  /** Absolute amount of "active electrical energy" (Wh or kWh) exported (to the grid) during an associated time "interval", specified by a Metervalues ReadingContext, and applicable interval duration configuration values (in seconds) for "ClockAlignedDataInterval" and "MeterValueSampleInterval". */
  "Energy.Active.Export.Interval" = "Energy.Active.Export.Interval",
  /** Absolute amount of "active electrical energy" (Wh or kWh) imported (from the grid supply) during an associated time "interval", specified by a Metervalues ReadingContext, and applicable interval duration configuration values (in seconds) for "ClockAlignedDataInterval" and "MeterValueSampleInterval". */
  "Energy.Active.Import.Interval" = "Energy.Active.Import.Interval",
  /** Absolute amount of "reactive electrical energy" (VARh or kVARh) exported (to the grid) during an associated time "interval", specified by a Metervalues ReadingContext, and applicable interval duration configuration values (in seconds) for "ClockAlignedDataInterval" and "MeterValueSampleInterval". */
  "Energy.Reactive.Export.Interval" = "Energy.Reactive.Export.Interval",
  /** Absolute amount of "reactive electrical energy" (VARh or kVARh) imported (from the grid supply) during an associated time "interval", specified by a Metervalues ReadingContext, and applicable interval duration configuration values (in seconds) for "ClockAlignedDataInterval" and "MeterValueSampleInterval". */
  "Energy.Reactive.Import.Interval" = "Energy.Reactive.Import.Interval",
  /** Instantaneous reading of powerline frequency. NOTE: OCPP 1.6 does not have a UnitOfMeasure for frequency, the UnitOfMeasure for any SampledValue with measurand: Frequency is Hertz. */
  "Frequency" = "Frequency",
  /** Instantaneous active power exported by EV. (W or kW) */
  "Power.Active.Export" = "Power.Active.Export",
  /** Instantaneous active power imported by EV. (W or kW) */
  "Power.Active.Import" = "Power.Active.Import",
  /** Instantaneous power factor of total energy flow */
  "Power.Factor" = "Power.Factor",
  /** Maximum power offered to EV */
  "Power.Offered" = "Power.Offered",
  /** Instantaneous reactive power exported by EV. (var or kvar) */
  "Power.Reactive.Export" = "Power.Reactive.Export",
  /** Instantaneous reactive power imported by EV. (var or kvar) */
  "Power.Reactive.Import" = "Power.Reactive.Import",
  /** Fan speed in RPM */
  "RPM" = "RPM",
  /** State of charge of charging vehicle in percentage */
  "SoC" = "SoC",
  /** Temperature reading inside Charge Point. */
  "Temperature" = "Temperature",
  /** Instantaneous AC RMS supply voltage */
  "Voltage" = "Voltage",
}

/**
 * Type of request to be triggered in a TriggerMessage.req.
 */
export const enum MessageTrigger {
  /** To trigger a BootNotification request */
  BootNotification = "BootNotification",
  /** To trigger a DiagnosticsStatusNotification request */
  DiagnosticsStatusNotification = "DiagnosticsStatusNotification",
  /** To trigger a FirmwareStatusNotification request */
  FirmwareStatusNotification = "FirmwareStatusNotification",
  /** To trigger a Heartbeat request */
  Heartbeat = "Heartbeat",
  /** To trigger a MeterValues request */
  MeterValues = "MeterValues",
  /** To trigger a StatusNotification request */
  StatusNotification = "StatusNotification",
}

/**
 * Collection of one or more sampled values in MeterValues.req and StopTransaction.req. All sampled values in a MeterValue are sampled at the same point in time.
 */
export type MeterValue = {
  /** Required. Timestamp for measured value(s). */
  timestamp: string | Date;
  /** Required. One or more measured values */
  sampledValue: Array<SampledValue>;
};

/**
 * Phase as used in SampledValue. Phase specifies how a measured value is to be interpreted. Please note that not all values of Phase are applicable to all Measurands.
 */

export const enum Phase {
  /** Measured on L1 */
  L1 = "L1",
  /** Measured on L2 */
  L2 = "L2",
  /** Measured on L3 */
  L3 = "L3",
  /** Measured on Neutral */
  N = "N",
  /** Measured on L1 with respect to Neutral conductor */
  "L1-N" = "L1-N",
  /** Measured on L2 with respect to Neutral conductor */
  "L2-N" = "L2-N",
  /** Measured on L3 with respect to Neutral conductor */
  "L3-N" = "L3-N",
  /** Measured between L1 and L2 */
  "L1-L2" = "L1-L2",
  /** Measured between L2 and L3 */
  "L2-L3" = "L2-L3",
  /** Measured between L3 and L1 */
  "L3 -L1" = "L3 -L1",
}

/**
 * Values of the context field of a value in SampledValue.
 */
export const enum ReadingContext {
  /** Value taken at start of interruption. */
  "Interruption.Begin" = "Interruption.Begin",
  /** Value taken when resuming after interruption. */
  "Interruption.End" = "Interruption.End",
  /** Value for any other situations. */
  "Other" = "Other",
  /** Value taken at clock aligned interval. */
  "Sample.Clock" = "Sample.Clock",
  /** Value taken as periodic sample relative to start time of transaction. */
  "Sample.Periodic" = "Sample.Periodic",
  /** Value taken at start of transaction. */
  "Transaction.Begin" = "Transaction.Begin",
  /** Value taken at end of transaction. */
  "Transaction.End" = "Transaction.End",
  /** Value taken in response to a TriggerMessage.req */
  "Trigger" = "Trigger",
}

/**
 * Reason for stopping a transaction in StopTransaction.req.
 */
export const enum Reason {
  /** The transaction was stopped because of the authorization status in a StartTransaction.conf */
  "DeAuthorized" = "DeAuthorized",
  /** Emergency stop button was used. */
  "EmergencyStop" = "EmergencyStop",
  /** disconnecting of cable, vehicle moved away from inductive charge unit. */
  "EVDisconnected" = "EVDisconnected",
  /** A hard reset command was received. */
  "HardReset" = "HardReset",
  /** Stopped locally on request of the user at the Charge Point. This is a regular termination of a transaction. Examples: presenting an RFID tag, pressing a button to stop. */
  "Local" = "Local",
  /** Any other reason. */
  "Other" = "Other",
  /** Complete loss of power. */
  "PowerLoss" = "PowerLoss",
  /** A locally initiated reset/reboot occurred. (for instance watchdog kicked in) */
  "Reboot" = "Reboot",
  /** Stopped remotely on request of the user. This is a regular termination of a transaction. Examples: termination using a smartphone app, exceeding a (non local) prepaid credit. */
  "Remote" = "Remote",
  /** A soft reset command was received. */
  "SoftReset" = "SoftReset",
  /** Central System sent an Unlock Connector command. */
  "UnlockCommand" = "UnlockCommand",
}

/**
 * Type of recurrence of a charging profile, as used in ChargingProfile.
 */
export const enum RecurrencyKindType {
  /** The schedule restarts every 24 hours, at the same time as in the startSchedule. */
  Daily = "Daily",
  /** The schedule restarts every 7 days, at the same time and day-of-the-week as in the startSchedule. */
  Weekly = "Weekly",
}

/**
 * Result of registration in response to BootNotification.req.
 */
export const enum RegistrationStatus {
  /** Charge point is accepted by Central System. */
  Accepted = "Accepted",
  /** Central System is not yet ready to accept the Charge Point. Central System may send messages to retrieve information or prepare the Charge Point. */
  Pending = "Pending",
  /** Charge point is not accepted by Central System. This may happen when the Charge Point id is not known by Central System. */
  Rejected = "Rejected",
}

/**
 * The result of a RemoteStartTransaction.req or RemoteStopTransaction.req request.
 */
export const enum RemoteStartStopStatus {
  /** Command will be executed. */
  Accepted = "Accepted",
  /** Command will not be executed. */
  Rejected = "Rejected",
}

/**
 * Status in ReserveNow.conf.
 */
export const enum ReservationStatus {
  /** Reservation has been made. */
  Accepted = "Accepted",
  /** Reservation has not been made, because connectors or specified connector are in a faulted state. */
  Faulted = "Faulted",
  /** Reservation has not been made. All connectors or the specified connector are occupied. */
  Occupied = "Occupied",
  /** Reservation has not been made. Charge Point is not configured to accept reservations. */
  Rejection = "Rejected",
  /** Reservation has not been made, because connectors or specified connector are in an unavailable state. */
  Unavailable = "Unavailable",
}

/**
 * Result of Reset.req.
 */
export const enum ResetStatus {
  /** Command will be executed. */
  Accepted = "Accepted",
  /** Command will not be executed. */
  Rejected = "Rejected",
}

/**
 * Type of reset requested by Reset.req.
 */
export const enum ResetType {
  /** Restart (all) the hardware, the Charge Point is not required to gracefully stop ongoing transaction. If possible the Charge Point sends a StopTransaction.req for previously ongoing transactions after having restarted and having been accepted by the Central System via a BootNotification.conf. This is a last resort solution for a not correctly functioning Charge Point, by sending a "hard" reset, (queued) information might get lost. */
  Hard = "Hard",
  /** Stop ongoing transactions gracefully and sending StopTransaction.req for every ongoing transaction. It should then restart the application software (if possible, otherwise restart the processor/controller). */
  Soft = "Soft",
}

/**
 * Single sampled value in MeterValues. Each value can be accompanied by optional fields.
 */
export type SampledValue = {
  /** Required. Value as a “Raw” (decimal) number or “SignedData”. Field Type is “string” to allow for digitally signed data readings. Decimal numeric values are also acceptable to allow fractional values for measurands such as Temperature and Current. */
  value: string;
  /** Optional. Type of detail value: start, end or sample. Default = “Sample.Periodic” */
  context?: ReadingContext;
  /** Optional. Raw or signed data. Default = “Raw” */
  format?: ValueFormat;
  /** Optional. Type of measurement. Default = “Energy.Active.Import.Register” */
  measurand?: Measurand;
  /** Optional. indicates how the measured value is to be interpreted. For instance between L1 and neutral (L1-N) Please note that not all values of phase are applicable to all Measurands. When phase is absent, the measured value is interpreted as an overall value. */
  phase: Phase;
  /** Optional. Location of measurement. Default=”Outlet” */
  location: Location;
  /** Optional. Unit of the value. Default = “Wh” if the (default) measurand is an “Energy” type. */
  unit: UnitOfMeasure;
};

/**
 * Status in TriggerMessage.conf.
 */
export const enum TriggerMessageStatus {
  /** Requested notification will be sent. */
  Accepted = "Accepted",
  /** Requested notification will not be sent. */
  Rejected = "Rejected",
  /** Requested notification cannot be sent because it is either not implemented or unknown. */
  NotImplemented = "NotImplemented",
}

/** Allowable values of the optional "unit" field of a Value element, as used in SampledValue. Default value of "unit" is always "Wh". */
export const enum UnitOfMeasure {
  /** Watt-hours (energy). Default. */
  "Wh" = "Wh",
  /** kiloWatt-hours (energy). */
  "kWh" = "kWh",
  /** Var-hours (reactive energy). */
  "varh" = "varh",
  /** kilovar-hours (reactive energy). */
  "kvarh" = "kvarh",
  /** Watts (power). */
  "W" = "W",
  /** kilowatts (power). */
  "kW" = "kW",
  /** VoltAmpere (apparent power). */
  "VA" = "VA",
  /** kiloVolt Ampere (apparent power). */
  "kVA" = "kVA",
  /** Vars (reactive power). */
  "var" = "var",
  /** kilovars (reactive power). */
  "kvar" = "kvar",
  /** Amperes (current). */
  "A" = "A",
  /** Voltage (r.m.s. AC). */
  "V" = "V",
  /** Degrees (temperature). */
  "Celsius" = "Celsius",
  /** Degrees (temperature). */
  "Fahrenheit" = "Fahrenheit",
  /** Degrees Kelvin (temperature). */
  "K" = "K",
  /** Percentage. */
  "Percent" = "Percent",
}

/**
 * Status in response to UnlockConnector.req.
 */
export const enum UnlockStatus {
  /** Connector has successfully been unlocked. */
  "Unlocked" = "Unlocked",
  /** Failed to unlock the connector: The Charge Point has tried to unlock the connector and has detected that the connector is still locked or the unlock mechanism failed. */
  "UnlockFailed" = "UnlockFailed",
  /** Charge Point has no connector lock, or ConnectorId is unknown. */
  "NotSupported" = "NotSupported",
}

/**
 * Type of update for a SendLocalList.req.
 */
export const enum UpdateStatus {
  /** Local Authorization List successfully updated. */
  Accepted = "Accepted",
  /** Failed to update the Local Authorization List. */
  Failed = "Failed",
  /** Update of Local Authorization List is not supported by Charge Point. */
  NotSupported = "NotSupported",
  /** Version number in the request for a differential update is less or equal then version number of current list. */
  VersionMismatch = "VersionMismatch",
}

/**
 * Type of update for a SendLocalList.req.
 */
export const enum UpdateType {
  /** Indicates that the current Local Authorization List must be updated with the values in this message. */
  Differential = "Differential",
  /** Indicates that the current Local Authorization List must be replaced by the values in this message. */
  Full = "Full",
}

/**
 * Format that specifies how the value element in SampledValue is to be interpreted.
 */
export const enum ValueFormat {
  /** Data is to be interpreted as integer/decimal numeric data. */
  Raw = "Raw",
  /** Data is represented as a signed binary data block, encoded as hex data. */
  SignedData = "SignedData",
}

export type AuthorizeReq = {
  /** Required. This contains the identifier that needs to be authorized. */
  idToken: IdToken;
};
export type AuthorizeConf = {
  /** Required. This contains information about authorization status, expiry and parent id. */
  idTagInfo: IdTagInfo;
};
export type BootNotificationReq = {
  /** Optional. This contains a value that identifies the serial number of the Charge Box inside the Charge Point. Deprecated, will be removed in future version */
  chargeBoxSerialNumber?: CiString25Type;
  /** Required. This contains a value that identifies the model of the ChargePoint. */
  chargePointModel: CiString20Type;
  /** Optional. This contains a value that identifies the serial number of the Charge Point. */
  chargePointSerialNumber?: CiString25Type;
  /** Required. This contains a value that identifies the vendor of the ChargePoint. */
  chargePointVendor: CiString20Type;
  /** Optional. This contains the firmware version of the Charge Point. */
  firmwareVersion?: CiString50Type;
  /** Optional. This contains the ICCID of the modem’s SIM card. */
  iccid?: CiString20Type;
  /** Optional. This contains the IMSI of the modem’s SIM card. */
  imsi?: CiString20Type;
  /** Optional. This contains the serial number of the main electrical meter of the Charge Point. */
  meterSerialNumber?: CiString25Type;
  /** Optional. This contains the type of the main electrical meter of the Charge Point. */
  meterType?: CiString25Type;
};
export type BootNotificationConf = {
  /** Required. This contains the Central System’s current time. */
  currentTime: string | Date;
  /** Required. When RegistrationStatus is Accepted, this contains the heartbeat interval in seconds. If the Central System returns something other than Accepted, the value of the interval field indicates the minimum wait time before sending a next BootNotification request. */
  interval: number;
  /** Required. This contains whether the Charge Point has been registered within the System Central. */
  status: RegistrationStatus;
};
export type CancelReservationReq = {
  /** Required. Id of the reservation to cancel. */
  reservationId: number;
};
export type CancelReservationConf = {
  /** Required. This indicates the success or failure of the cancelling of a reservation by Central System. */
  status: CancelReservationStatus;
};
export type ChangeAvailabilityReq = {
  /** Required. The id of the connector for which availability needs to change. Id '0' (zero) is used if the availability of the Charge Point and all its connectors needs to change. */
  connectorId: number;
  /** Required. This contains the type of availability change that the Charge Point should perform. */
  type: AvailabilityType;
};
export type ChangeAvailabilityConf = {
  /** Required. This indicates whether the Charge Point is able to perform the availability change. */
  status: AvailabilityStatus;
};

export type ChangeConfigurationReq = {
  /**
   * Required. The name of the configuration setting to change.
   * See for standard configuration key names and associated values
   * */
  key: CiString50Type;
  /**
   * Required. The new value as string for the setting.
   * See for standard configuration key names and associated values
   */
  value: CiString500Type;
};
export type ChangeConfigurationConf = {
  /** Required. Returns whether configuration change has been accepted. */
  status: ConfigurationStatus;
};
export type ClearCacheReq = {};
export type ClearCacheConf = {
  /** Required. Accepted if the Charge Point has executed the request, otherwise rejected. */
  status: ClearCacheStatus;
};
export type ClearChargingProfileReq = {
  /** Optional. The ID of the charging profile to clear. */
  id?: number;
  /** Optional. Specifies the ID of the connector for which to clear charging profiles. A connectorId of zero (0) specifies the charging profile for the overall Charge Point. Absence of this parameter means the clearing applies to all charging profiles that match the other criteria in the request. */
  connectorId: number;
  /** Optional. Specifies to purpose of the charging profiles that will be cleared, if they meet the other criteria in the request. */
  chargingProfilePurpose: ChargingProfilePurposeType;
  /** Optional. specifies the stackLevel for which charging profiles will be cleared, if they meet the other criteria in the request */
  stackLevel: number;
};
export type ClearChargingProfileConf = {
  /** Required. Indicates if the Charge Point was able to execute the request. */
  status: ClearCacheStatus;
};
export type DataTransferReq = {
  /** Required. This identifies the Vendor specific implementation */
  vendorId: CiString255Type;
  /** Optional. Additional identification field */
  messageId?: CiString50Type;
  /** Optional. Data without specified length or format. */
  data?: string;
};
export type DataTransferConf = {
  /** Required. This indicates the success or failure of the data transfer. */
  status: DataTransferStatus;
  /** Optional. Data in response to request. */
  data?: string;
};
export type DiagnosticsStatusNotificationReq = {
  /** Required. This contains the status of the diagnostics upload. */
  status: DiagnosticsStatus;
};
export type DiagnosticsStatusNotificationConf = {};
export type FirmwareStatusNotificationReq = {
  /** Required. This contains the progress status of the firmware installation. */
  status: FirmwareStatus;
};
export type FirmwareStatusNotificationConf = {};
export type GetCompositeScheduleReq = {
  /** Required. The ID of the Connector for which the schedule is requested. When ConnectorId=0, the Charge Point will calculate the expected consumption for the grid connection. */
  connectorId: number;
  /** Required. Time in seconds. length of requested schedule */
  duration: number;
  /** Optional. Can be used to force a power or current profile */
  chargingRateUnit?: ChargingRateUnitType;
};
export type GetCompositeScheduleConf = {
  /** Required. Status of the request. The Charge Point will indicate if it was able to process the request */
  status: GetCompositeScheduleStatus;
  /** Optional. The charging schedule contained in this notification applies to a Connector. */
  connectorId: number;
  /**
   * Optional. Time. Periods contained in the charging profile are relative to this point in time.
   * If status is "Rejected", this field may be absent.
   */
  scheduleStart?: string;
  /**
   * Optional. Planned Composite Charging Schedule, the energy consumption over time. Always relative to ScheduleStart.
   * If status is "Rejected", this field may be absent.
   */
  chargingSchedule?: ChargingSchedule;
};
export type GetConfigurationReq = {
  /** Optional. List of keys for which the configuration value is requested. */
  key?: CiString50Type;
};
export type GetConfigurationConf = {
  /** Optional. List of requested or known keys */
  configurationKey?: Array<CiString50Type>;
  unknownKey?: Array<CiString50Type>;
};
export type GetDiagnosticsReq = {
  /** Required. This contains the location (directory) where the diagnostics file shall be uploaded to. */
  location: string;
  /** Optional. This specifies how many times Charge Point must try to upload the diagnostics before giving up. If this field is not present, it is left to Charge Point to decide how many times it wants to retry. */
  retries?: number;
  /** Optional. The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charge Point to decide how long to wait between attempts. */
  retryInterval?: number;
  /** Optional. This contains the date and time of the oldest logging information to include in the diagnostics. */
  startTime: string;
  /** Optional. This contains the date and time of the latest logging information to include in the diagnostics. */
  stopTime: string;
};
export type GetDiagnosticsConf = {
  /** Optional. This contains the name of the file with diagnostic information that will be uploaded. This field is not present when no diagnostic information is available. */
  filename?: CiString255Type;
};
export type GetLocalListVersionReq = {};
export type GetLocalListVersionConf = {
  /** Required. This contains the current version number of the local authorization list in the Charge Point. */
  listVersion: number;
};
export type HeartbeatReq = {};
export type HeartbeatConf = {
  /** Required. This contains the current time of the Central System. */
  currentTime: string;
};
export type MeterValuesReq = {
  /** Required. This contains a number (>0) designating a connector of the Charge Point.‘0’ (zero) is used to designate the main powermeter.*/
  connectorId: number;
  /** Optional. The transaction to which these meter samples are related. */
  transactionId?: number;
  /** Required. The sampled meter values with timestamps. */
  meterValue: Array<MeterValue>;
};
export type MeterValuesConf = {};
export type RemoteStartTransactionReq = {
  /* Optional. Number of the connector on which to start the transaction. connectorId SHALL be > 0 */
  connectorId?: number;
  /* Required. The identifier that Charge Point must use to start a transaction. */
  idTag: IdToken;
  /** Optional. Charging Profile to be used by the Charge Point for the requested transaction. ChargingProfilePurpose MUST be set to TxProfile */
  chargingProfile?: ChargingProfile;
};
export type RemoteStartTransactionConf = {
  /** Required. Status indicating whether Charge Point accepts the request to start a transaction. */
  status: RemoteStartStopStatus;
};
export type RemoteStopTransactionReq = {
  /** Required. The identifier of the transaction which Charge Point is requested to stop. */
  transactionId: number;
};
export type RemoteStopTransactionConf = {
  /** Required. Status indicating whether Charge Point accepts the request to stop a transaction. */
  status: RemoteStartStopStatus;
};
export type ReserveNowReq = {
  /* Required. This contains the id of the connector to be reserved. A value of 0 means that the reservation is not for a specific connector. */
  connectorId: number;
  /** Required. This contains the date and time when the reservation ends. */
  expiryDate: string;
  /** Required. The identifier for which the Charge Point has to reserve a connector. */
  idTag: IdToken;
  /** Optional. The parent idTag. */
  parentIdTag?: IdToken;
  /** Required. Unique id for this reservation. */
  reservationId: number;
};
export type ReserveNowConf = {
  /** Required. This indicates the success or failure of the reservation. */
  status: ReservationStatus;
};
export type ResetReq = {
  /** Required. This contains the type of reset that the Charge Point should perform. */
  type: ResetType;
};
export type ResetConf = {
  /** Required. This indicates whether the Charge Point is able to perform the reset. */
  status: ResetStatus;
};
export type SendLocalListReq = {
  /** Required. In case of a full update this is the version number of the full list. In case of a differential update it is the version number of the list after the update has been applied. */
  listVersion: number;
  /** Optional. In case of a full update this contains the list of values that form the new local authorization list. In case of a differential update it contains the changes to be applied to the local authorization list in the Charge Point. Maximum number of AuthorizationData elements is available in the configuration key: SendLocalListMaxLength */
  localAuthorizationList?: Array<AuthorizationData>;
  /** Required. This contains the type of update (full or differential) of this request. */
  updateType: UpdateType;
};
export type SendLocalListConf = {
  /** Required. This indicates whether the Charge Point has successfully received and applied the update of the local authorization list. */
  status: UpdateStatus;
};
export type SetChargingProfileReq = {
  /** Required. The connector to which the charging profile applies. If connectorId = 0, the message contains an overall limit for the Charge Point. */
  connectorId: number;
  /** Required. The charging profile to be set at the Charge Point. */
  csChargingProfiles: ChargingProfile;
};
export type SetChargingProfileConf = {
  /** Required. Returns whether the Charge Point has been able to process the message successfully. This does not guarantee the schedule will be followed to the letter. There might be other constraints the Charge Point may need to take into account. */
  status: ChargingProfileStatus;
};
export type StartTransactionReq = {
  /* Required. This identifies which connector of the Charge Point is used. */
  connectorId: number;
  /** Required. This contains the identifier for which a transaction has to be started. */
  idTag: IdToken;
  /** Required. This contains the meter value in Wh for the connector at start of the transaction. */
  meterStart: number;
  /** Optional. This contains the id of the reservation that terminates as a result of this transaction. */
  reservationId?: number;
  /** Required. This contains the date and time on which the transaction is started. */
  timestamp: string;
};
export type StartTransactionConf = {
  /* Required. This contains information about authorization status, expiry and parent id. */
  idTagInfo: IdTagInfo;
  transactionId: number;
};
export type StatusNotificationReq = {
  /** Required. The id of the connector for which the status is reported. Id '0' (zero) is used if the status is for the Charge Point main controller. */
  connectorId: number;
  /** Required. This contains the error code reported by the Charge Point. */
  errorCode?: ChargePointErrorCode;
  /** Optional. Additional free format information related to the error. */
  info?: CiString50Type;
  /** Required. This contains the current status of the Charge Point. */
  status: ChargePointStatus;
  /** Optional. The time for which the status is reported. If absent time of receipt of the message will be assumed. */
  timestamp?: string;
  /** Optional. This identifies the vendor-specific implementation. */
  vendorId?: CiString255Type;
  /** Optional. This contains the vendor-specific error code. */
  vendorErrorCode?: CiString50Type;
};
export type StatusNotificationConf = {};
export type StopTransactionReq = {
  /* Optional. This contains the identifier which requested to stop the charging. It is optional because a Charge Point may terminate charging without the presence of an idTag, e.g. in case of a reset. A Charge Point SHALL send the idTag if known. */
  idTag?: IdToken;
  /** Required. This contains the meter value in Wh for the connector at end of the transaction. */
  meterStop: number;
  /** Required. This contains the date and time on which the transaction is stopped. */
  timestamp: string;
  /** Required. This contains the transaction-id as received by the StartTransaction.conf. */
  transactionId: number;
  /** Optional. This contains the reason why the transaction was stopped. MAY only be omitted when the Reason is "Local". */
  reason?: Reason;
  /** Optional. This contains transaction usage details relevant for billing purposes. */
  transactionData: MeterValue;
};
export type StopTransactionConf = {
  /** Optional. This contains information about authorization status, expiry and parent id. It is optional, because a transaction may have been stopped without an identifier. */
  idTagInfo?: IdTagInfo;
};
export type TriggerMessageReq = {
  /** Required. */
  requestedMessage: MessageTrigger;
  /** Optional. Only filled in when request applies to a specific connector. */
  connectorId: number;
};
export type TriggerMessageConf = {
  /** Required. Indicates whether the Charge Point will send the requested notification or not. */
  status: TriggerMessageStatus;
};
export type UnlockConnectorReq = {
  /** Required. This contains the identifier of the connector to be unlocked. */
  connectorId: number;
};
export type UnlockConnectorConf = {
  /** Required. This indicates whether the Charge Point has unlocked the connector. */
  status: UnlockStatus;
};
export type UpdateFirmwareReq = {
  /** Required. This contains a string containing a URI pointing to a location from which to retrieve the firmware. */
  location: string;
  /** Optional. This specifies how many times Charge Point must try to download the firmware before giving up. If this field is not present, it is left to Charge Point to decide how many times it wants to retry. */
  retries?: number;
  /** Required. This contains the date and time after which the Charge Point is allowed to retrieve the (new) firmware. */
  retrieveDate: string;
  /** Optional. The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charge Point to decide how long to wait between attempts. */
  retryInterval?: number;
};
export type UpdateFirmwareConf = {};

export type Message =
  | "Authorize"
  | "BootNotification"
  | "CancelReservation"
  | "ChangeAvailability" /* after here*/
  | "ChangeConfiguration"
  | "ClearCache"
  | "ClearChargingProfile"
  | "DataTransfer"
  | "DiagnosticsStatusNotification"
  | "FirmwareStatusNotification"
  | "GetCompositeSchedule"
  | "GetConfiguration"
  | "GetDiagnostics"
  | "GetLocalListVersion"
  | "Heartbeat"
  | "MeterValues"
  | "RemoteStartTransaction"
  | "RemoteStopTransaction"
  | "ReserveNow"
  | "Reset"
  | "SendLocalList"
  | "SetChargingProfile"
  | "StartTransaction"
  | "StatusNotification"
  | "StopTransaction"
  | "TriggerMessage"
  | "UnlockConnector"
  | "UpdateFirmware";

type RpcFunctionsReq<MESSAGE extends Message> = MESSAGE extends "Authorize"
  ? AuthorizeReq
  : MESSAGE extends "BootNotification"
  ? BootNotificationReq
  : MESSAGE extends "CancelReservation"
  ? CancelReservationReq
  : MESSAGE extends "ChangeAvailability"
  ? ChangeAvailabilityReq
  : MESSAGE extends "ChangeConfiguration"
  ? ChangeConfigurationReq
  : MESSAGE extends "ClearCache"
  ? ClearCacheReq
  : MESSAGE extends "ClearChargingProfile"
  ? ClearChargingProfileReq
  : MESSAGE extends "DataTransfer"
  ? DataTransferReq
  : MESSAGE extends "DiagnosticsStatusNotification"
  ? DiagnosticsStatusNotificationReq
  : MESSAGE extends "FirmwareStatusNotification"
  ? FirmwareStatusNotificationReq
  : MESSAGE extends "GetCompositeSchedule"
  ? GetCompositeScheduleReq
  : MESSAGE extends "GetConfiguration"
  ? GetConfigurationReq
  : MESSAGE extends "GetDiagnostics"
  ? GetDiagnosticsReq
  : MESSAGE extends "GetLocalListVersion"
  ? GetLocalListVersionReq
  : MESSAGE extends "Heartbeat"
  ? HeartbeatReq
  : MESSAGE extends "MeterValues"
  ? MeterValuesReq
  : MESSAGE extends "RemoteStartTransaction"
  ? RemoteStartTransactionReq
  : MESSAGE extends "RemoteStopTransaction"
  ? RemoteStopTransactionReq
  : MESSAGE extends "ReserveNow"
  ? ReserveNowReq
  : MESSAGE extends "Reset"
  ? ResetReq
  : MESSAGE extends "SendLocalList"
  ? SendLocalListReq
  : MESSAGE extends "SetChargingProfile"
  ? SetChargingProfileReq
  : MESSAGE extends "StartTransaction"
  ? StartTransactionReq
  : MESSAGE extends "StatusNotification"
  ? StatusNotificationReq
  : MESSAGE extends "StopTransaction"
  ? StopTransactionReq
  : MESSAGE extends "TriggerMessage"
  ? TriggerMessageReq
  : MESSAGE extends "UnlockConnector"
  ? UnlockConnectorReq
  : MESSAGE extends "UpdateFirmware"
  ? UpdateFirmwareReq
  : any;

type RpcFunctionsConf<MESSAGE extends Message> = MESSAGE extends "Authorize"
  ? AuthorizeConf
  : MESSAGE extends "BootNotification"
  ? BootNotificationConf
  : MESSAGE extends "CancelReservation"
  ? CancelReservationConf
  : MESSAGE extends "ChangeAvailability"
  ? ChangeAvailabilityConf
  : MESSAGE extends "ChangeConfiguration"
  ? ChangeConfigurationConf
  : MESSAGE extends "ClearCache"
  ? ClearCacheConf
  : MESSAGE extends "ClearChargingProfile"
  ? ClearChargingProfileConf
  : MESSAGE extends "DataTransfer"
  ? DataTransferConf
  : MESSAGE extends "DiagnosticsStatusNotification"
  ? DiagnosticsStatusNotificationConf
  : MESSAGE extends "FirmwareStatusNotification"
  ? FirmwareStatusNotificationConf
  : MESSAGE extends "GetCompositeSchedule"
  ? GetCompositeScheduleConf
  : MESSAGE extends "GetConfiguration"
  ? GetConfigurationConf
  : MESSAGE extends "GetDiagnostics"
  ? GetDiagnosticsConf
  : MESSAGE extends "GetLocalListVersion"
  ? GetLocalListVersionConf
  : MESSAGE extends "Heartbeat"
  ? HeartbeatConf
  : MESSAGE extends "MeterValues"
  ? MeterValuesConf
  : MESSAGE extends "RemoteStartTransaction"
  ? RemoteStartTransactionConf
  : MESSAGE extends "RemoteStopTransaction"
  ? RemoteStopTransactionConf
  : MESSAGE extends "ReserveNow"
  ? ReserveNowConf
  : MESSAGE extends "Reset"
  ? ResetConf
  : MESSAGE extends "SendLocalList"
  ? SendLocalListConf
  : MESSAGE extends "SetChargingProfile"
  ? SetChargingProfileConf
  : MESSAGE extends "StartTransaction"
  ? StartTransactionConf
  : MESSAGE extends "StatusNotification"
  ? StatusNotificationConf
  : MESSAGE extends "StopTransaction"
  ? StopTransactionConf
  : MESSAGE extends "TriggerMessage"
  ? TriggerMessageConf
  : MESSAGE extends "UnlockConnector"
  ? UnlockConnectorConf
  : MESSAGE extends "UpdateFirmware"
  ? UpdateFirmwareConf
  : any;

type RpcCallbackArgs<OPERATION extends Message> = {
  method: string;
  params: RpcFunctionsReq<OPERATION>;
  reply: (confirmation: RpcFunctionsConf<OPERATION>) => Promise<void>;
};
type RPCCallback<OPERATION extends Message> = (
  args: RpcCallbackArgs<OPERATION>
) => RpcFunctionsConf<OPERATION> | Symbol | void;
