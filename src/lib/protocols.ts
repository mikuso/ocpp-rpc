import { OCPP1_6Methods } from './schemas/ocpp1_6.json';
import { OCPP2_0_1Methods } from './schemas/ocpp2_0_1.json';

type AnonymousMethodsMap = {
    [protocol: string]: {
        [methodName: string]: {
            req: any;
            conf: any;
        };
    };
};

export type ProtocolMethodsMap = {
    'ocpp1.6': OCPP1_6Methods;
    'ocpp2.0.1': OCPP2_0_1Methods;
} & AnonymousMethodsMap;

// export type ProtocolNames = keyof ProtocolMethodsMap;
export type ProtocolNames = 'ocpp1.6' | 'ocpp2.0.1' | string;

export type RequestMethod<
    T extends ProtocolNames,
    M extends keyof ProtocolMethodsMap[T]
> = ProtocolMethodsMap[T][M] extends {req: infer R} ? R : never;

export type HandlerOptions<
    T extends ProtocolNames,
    M extends keyof ProtocolMethodsMap[T],
> = {
    method: M;
    params: RequestMethod<T, M>;
    signal: AbortSignal;
    messageId: string;
    // reply: (response: Res | Error) => void
}
