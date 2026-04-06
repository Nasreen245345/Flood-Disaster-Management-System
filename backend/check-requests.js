require('dotenv').config();
const mongoose = require('mongoose');
const AidRequest = require('./src/models/AidRequest');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // Find the victim user
    const user = await User.findOne({ cnic: '3830211844218' });
    console.log('Victim user:', user?.name, '| ID:', user?._id, '| CNIC:', user?.cnic);

    // Find requests by requester ID
    const byRequester = await AidRequest.find({ requester: user?._id });
    console.log('\nRequests by requester ID:', byRequester.length);

    // Find requests by CNIC (with dashes)
    const byCNICDash = await AidRequest.find({ victimCNIC: '38302-1184421-8' });
    console.log('Requests by CNIC (with dashes):', byCNICDash.length);
    byCNICDash.forEach(r => console.log(' -', r.victimName, '| CNIC:', r.victimCNIC));

    // Find requests by CNIC (without dashes)
    const byCNICNoDash = await AidRequest.find({ victimCNIC: '3830211844218' });
    console.log('Requests by CNIC (no dashes):', byCNICNoDash.length);

    process.exit(0);
});
