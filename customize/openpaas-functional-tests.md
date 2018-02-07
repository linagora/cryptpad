# Non-regression tests

This checklist is for OpenPaas/Cryptpad contributors to assist in reviewing pull requests to ensure that they are ready to merge.

Developers should follow this scenario before submitting a new PR to ensure no regression on previous features.  

These tests can be done all in sequence and should not take more than 5 minutes. 

> Pre-requisites: 
> - Working OpenPaaS and Cryptpad, protected by LemonLDAP
> - An LDAP client such as Apache Directory Studio, to be able to manipulate your LDAP data easily (create users)
> - A user account **User 2** should exist in the SSO user base **and** in Cryptpad.  
> - In Cryptpad, user 1 should have a "profile" (you can create it by visiting /profile when logged in as User 1)

### Auto-provisioning   
-  [ ] Tested   

1) Connect to your local LDAP using your preferred LDAP client   
2) Create a new entry for **User 1** in the *users* Organization Unit with information like:   
```
cn: <uniqueUsername@openpaas.local>
sn: <uniqueUsername@openpaas.local>
description: <uniqueRandomString>
displayName: <uniqueFullName>
mail: <uniqueUsername@openpaas.local>
uid: <uniqueUsername@openpaas.local>
userPassword: <uniqueUsername>
```
3) Open a browser private session ("incognito window")   
4) Go to your local OpenPaaS. You should be requested to log in using the LemonLDAP login page; log in as **User 1**.   
5) Once logged in, click on the OpenPaaS apps menu and select "Cryptpad"    
6) You should be redirected to Cryptpad; check that your new account was created (you should be logged in as **User 1**, previously unknown by CryptPad).  
Check that your OpenPaaS avatar was provided as avatar in CryptPad (should be a letter with a **colored background**)

### Log-out   
- [ ] Tested  

7) On the top right menu in Cryptpad, select *logout*   
8) Check that you are redirected to your LemonLDAP logout page.   

### Auto-login   
- [ ] Tested   

9) Go back to your local OpenPaaS and log as **User 2**   
10) In the OpenPaaS application menu, select the CryptPad Application   
11) Check that you are correctly logged in as **User 2**   

### Avatar check   
- [ ] Tested   

12) Check that you see an Avatar from OpenPaaS in Cryptpad (default is a colored background image with a letter)   
13) Go back to OpenPaaS (close the cryptpad tab)  
14) Go to `Profile > Edit`  
15) Upload a new Profile picture  
16) In the App menu, go back to Cryptpad  
17) Your Cryptpad avatar should now be your new OpenPaaS avatar  

### Share a new document   
- [ ] Tested   

18) Click on the "+" in your drive to create a new pad  
19) Click on the "Share" icon  
20) A tab "With OpenPaaS" should be present. Select `View` in the radio button, then click on "Share by email".  
21) In the composer window that opens, check that:  

- The content of the email is prefilled with a subject and body  
- The Cryptpad link contains `/view/`  

22) Close the sharing window,   
23) Click on the share icon again, but leave the radio button selection to `Edit` and click "Share by email"   
22) Add **User 1** as recipient (you should have autocomplete),   
23) Send the email,   
24) Close window and logout   
25) Log back into your local OpenPaaS as **User 1**   
26) Copy/paste the link received by email and check that you can edit the document.   

### Types of pad available   
- [ ] Tested   

25) In Cryptpad, click on the 'app menu' on the left of your avatar.  
26) Check that you only have the following types of pad available: `Rich text, Code & Presentation`