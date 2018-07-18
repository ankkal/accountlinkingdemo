# accountlinkingdemo


Create a user directory with a user pool.

To create a user pool

*Go to the Amazon Cognito console. You might be prompted for your AWS credentials.

*Choose Manage your User Pools.

*In the top-right corner of the page, choose Create a User Pool.

*Provide a name for your user pool, and choose Review Defaults to save the name.

*On the Attributes page, choose Email address or phone number and Allow email addresses.

*At the bottom of the page, choose Next Step to save the attribute.

*On the navigation bar on the left-side of the page, choose Review.

*On the bottom of the Review page, choose Create pool.

*Add an app to enable the hosted UI.

*Create App Client
    
After you create a user pool, you can create an app to use the built-in webpages for signing up and signing in your users.

To create an app in your user pool

*Go to the Amazon Cognito console. You might be prompted for your AWS credentials.

*Choose Manage your User Pools.

*Choose an existing user pool from the list, or create a user pool.

*On the navigation bar on the left-side of the page, choose App clients under General settings.

*Choose Add an app client.

*Give your app a name.

Clear the option Generate client secret for the purposes of this getting started exercise, as it would not be secure to send it on the URL using client-side JavaScript. The client secret is used by applications that have a server-side component that can secure the client secret.

*Choose Create app client.

Note the App client ID.

*Choose Return to pool details.

*Configure the app.

*Choose App client settings from the navigation bar on the left-side of the console page.

*Select Cognito User Pool as one of the Enabled Identity Providers.

Note

Type a callback URL for the Amazon Cognito authorization server to call after users are authenticated. For a web app, the URL should start with https://, such as https://www.example.com.

Select Authorization code grant to return an authorization code that is then exchanged for user pool tokens. Because the tokens are never exposed directly to an end user, they are less likely to become compromised. However, a custom application is required on the backend to exchange the authorization code for user pool tokens.

You can enable both the Authorization code grant and the Implicit code grant, and then use each grant as needed.

Unless you specifically want to exclude one, select the check boxes for all of the Allowed OAuth scopes.

Choose Save changes.

*Configure a user pool domain.

On the Domain name page, type a domain prefix that's available.

Make a note of the complete domain address.

Choose Save changes.

*To view your sign-in page

You can view the hosted UI sign-in webpage with the following URL. Note the response_type. In this case, response_type=code for the authentication code grant.


https://your_domain/login?response_type=code&client_id=your_app_client_id&redirect_uri=your_callback_url
You can view the hosted UI sign-in webpage with the following URL for the implicit code grant where response_type=token. After a successful sign-in, Amazon Cognito returns user pool tokens to your web browser's address bar.


https://your_domain/login?response_type=token&client_id=your_app_client_id&redirect_uri=your_callback_url

    
Configure Account Linking in the Alexa Developer Console.

Authorization Grant Type 


| Key | Value |
| -------- | ------------- |
|  Account Linking | |
| Authorization URL  | The /oauth2/authorize endpoint signs the user in. GET /oauth2/authorize |
|  Client ID  | |
|  Access Token URI  |The /oauth2/token endpoint gets the user's tokens. POST /oauth2/token |
|   Client Secret  | |

Write your Custom Skill Code.

Test Account Linking on Your Skill.

Access Resources


 
