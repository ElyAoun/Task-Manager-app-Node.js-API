// Middleware to prevent GET requests
// app.use((req, res, next)=>{
//     if(req.method === 'GET'){
//         res.send('GET requests are disabled')
//     } else{
//         next()
//     }
// })

// Middleware to prevent all API methods
// app.use((req,res,next)=>{
//     res.status(503).send('Site is currently down. Check back soon')
// })