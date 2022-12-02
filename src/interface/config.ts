export interface configInterface {
    url: string, 
    username: string, 
    password: string, 
    app_key: string, 
    app_secret: string
}

export interface token{
    expires_in:number,
    id_token:string,
    refresh_token:string,
    token_type:string
}

export interface IHeaders {
	username?: string;
	password?: string;
	authorization?: string;
	'x-app-key'?: string;
}

export type Intent = 'sale' | 'authorization';
export interface ICreatePayment {
	amount: number;
	orderID: string;
	intent: Intent;
	merchantAssociationInfo?: string;
}

export interface IRefundArgs extends Record<string, string> {
	paymentID: string;
	amount: string;
	trxID: string;
	sku: string;
}