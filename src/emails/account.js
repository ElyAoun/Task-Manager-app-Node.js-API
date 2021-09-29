const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ely.aoun@outlook.com',
        subject: 'Welcome to Task Manager App',
        text: `Wecome to the app, ${name}. Let me know how you get along with the app`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from :'ely.aoun@outlook.com',
        subject : 'Account Cancellation',
        text: `GoodBye, ${name}.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}