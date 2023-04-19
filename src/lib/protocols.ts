import { OCPP1_6Methods } from './schemas/ocpp1_6.json';
import { OCPP2_0_1Methods } from './schemas/ocpp2_0_1.json';

export type Protocol = "ocpp1.6" | "ocpp2.0.1" | string;
export type ProtocolMethods<T> = T extends "ocpp1.6"
    ? OCPP1_6Methods
    : T extends "ocpp2.0.1"
    ? OCPP2_0_1Methods
    : { [key: string]: any };

export type AllProtocolMethods = OCPP1_6Methods | OCPP2_0_1Methods | { [key: string]: any };
