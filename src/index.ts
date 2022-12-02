import { configInterface, ICreatePayment, IHeaders, IRefundArgs } from './interface/config'
import {
    IBkashCreatePaymentResponse,
    IBkashExecutePaymentResponse,
    IBkashQueryPaymentResponse,
    IBkashRefundResponse,
    IBkashRefundStatusResponse,
    IBkashSearchTransactionResponse,
    IBkashTokenResponse,
} from './interface/bkashResponce'
import { get, post } from './utils/index'
import { diffSeconds } from './utils/differentSecound'
import { BkashException } from './exceptions/bkashException';

export class Bkash {
    config: configInterface;
    private token!: string;
    private refreshToken!: string;
    private tokenIssueTime!: number;
    private headers: IHeaders;

    constructor(configInterface: configInterface) {
        this.validateConfig(configInterface);
        this.config = configInterface;
        this.headers = {
			username:this.config.username,
			password:this.config.password,
		};
    }

    public createPayment = async (paymentDetails: ICreatePayment): Promise<IBkashCreatePaymentResponse> => {
        const { amount, intent, orderID, merchantAssociationInfo } = paymentDetails;

        const payload = {
            amount,
            intent,
            currency: 'BDT',
            merchantInvoiceNumber: orderID,
            merchantAssociationInfo: merchantAssociationInfo ?? '',
        };

        const headers = await this.createTokenHeader();
        return await post<IBkashCreatePaymentResponse>(`${this.config.url}/checkout/payment/create`, payload, headers);
    };

    public executePayment = async (paymentID: string): Promise<IBkashExecutePaymentResponse> => {
		try {
			const headers = await this.createTokenHeader();
			return await post<IBkashExecutePaymentResponse>(
				`${this.config.url}/checkout/payment/execute/${paymentID}`,
				undefined,
				headers
			);
		} catch (error) {
			if (error instanceof BkashException) {
				throw error;
			}

			throw new BkashException('Timeout of 30 Seconds Exceeded While Executing Payment, Please Query the Payment');
		}
	};

    public queryPayment = async (paymentID: string): Promise<IBkashQueryPaymentResponse> => {
		const headers = await this.createTokenHeader();
		return await get<IBkashQueryPaymentResponse>(`${this.config.url}/checkout/payment/query/${paymentID}`, headers);
	};

    public searchTransaction = async (trxID: string): Promise<IBkashSearchTransactionResponse> => {
		return await get<IBkashSearchTransactionResponse>(
			`${this.config.url}/checkout/payment/query/${trxID}`,
			await this.createTokenHeader()
		);
	};

    public refundTransaction = async (refundInfo: IRefundArgs): Promise<IBkashRefundResponse> => {
		return post<IBkashRefundResponse>(
			`${this.config.url}/checkout/payment/refund`,
			refundInfo,
			await this.createTokenHeader()
		);
	};

    public refundStatus = async (trxID: string, paymentID: string): Promise<IBkashRefundStatusResponse> => {
		return await post<IBkashRefundStatusResponse>(
			`${this.config.url}/checkout/payment/refund`,
			{ trxID, paymentID },
			await this.createTokenHeader()
		);
	};

    private createTokenHeader = async (): Promise<IHeaders> => {
        const token = await this.getToken();
        return {
            authorization: token,
            'x-app-key': this.config.app_key,
        };
    };

    private getToken = async (): Promise<string> => {
        if (!this.token) {
            const { id_token, refresh_token, msg, status } = await this.getInitialToken();

            //throw error if bkash sends status [only happens when request fails]
            if (status && msg) throw new BkashException(msg);

            this.token = id_token;
            this.refreshToken = refresh_token;
            this.tokenIssueTime = Date.now();
            return this.token;
        }

        const diff = diffSeconds(this.tokenIssueTime);

        if (diff < 3500) {
            return this.token;
        }

        //token is expired, refresh it
        const { id_token, refresh_token, msg, status } = await this.newToken(this.refreshToken);

        //throw error if bkash sends status [only happens when request fails]
        if (status && msg) throw new BkashException(msg);

        this.token = id_token;
        this.refreshToken = refresh_token;
        this.tokenIssueTime = Date.now();
        return this.token;
    };

    private getInitialToken = async (): Promise<IBkashTokenResponse> => {
        const response = await post<IBkashTokenResponse>(
            `${this.config.url}/checkout/token/grant`,
            {
                app_key: this.config.app_key,
                app_secret: this.config.app_secret,
            },
            this.headers
        );
        if (response.status === 'fail') throw new BkashException('Invalid API Credentials Provided');
        return response;
    };

    private newToken = (refresh: string): Promise<IBkashTokenResponse> => {
        return post<IBkashTokenResponse>(
            `${this.config.url}/checkout/token/refresh`,
            {
                app_key: this.config.app_key,
                app_secret: this.config.app_secret,
                refresh_token: refresh,
            },
            this.headers
        );
    };

    private validateConfig = (config: configInterface): void => {
        const { url, app_key, password, app_secret, username } = config;

        if (!url || url === '') throw new BkashException('Invalid url provided');
        if (!app_key || app_key === '') throw new BkashException('Invalid API app_key provided');
        if (!app_secret || app_secret === '') throw new BkashException('Invalid API app_secret provided');
        if (!username || username === '') throw new BkashException('Invalid API username provided');
        if (!password || password === '') throw new BkashException('Invalid API password provided');
    };
}
