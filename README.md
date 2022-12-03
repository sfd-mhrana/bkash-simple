//Install Pakeg
npm install bkash-simple

import {Bkash} from 'bkash-simple'

const config={
    url:"string",
    username:"string",
    password:"string",
    app_key:"string",
    app_secret:"string"
}
const bkash=new Bkash(config)


//For Create Payment
const createPayment={
	amount: number,
	orderID: "string",
	intent: "sale | authorization",
    merchantAssociationInfo: "string"
}
bkash.createPayment(createPayment).then((res)=>{
    console.warn(res)
})


//Execute Payment
bkash.executePayment("paymentid").then((res)=>{
    console.warn(res)
})