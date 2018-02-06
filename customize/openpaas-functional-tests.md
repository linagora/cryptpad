# Non-regression tests

This checklist is for OpenPaas/Cryptpad contributors to assist in reviewing pull requests to ensure that they are ready to merge.

Developers should follow this scenario before submitting a new PR to ensure no regression on previous features.  

These tests can be done all in sequence and should not take more than 5 minutes. 

> Pre-requisites: 
> - Working OpenPaaS and Cryptpad, protected by LemonLDAP
> - User 1 should exist in the SSO user base **and** in Cryptpad.  
> - In Cryptpad, user 1 should have a "profile" (you can create it by visiting /profile when logged in as User 1)

### Auto-login   
- [ ] Tested   

1) Open a browser private session ("incognito window")  
2) Go to your local OpenPaaS. You should be requested to log in using the LemonLDAP login page; log in as User 1.  
3) Once logged in, click on the OpenPaaS apps menu and select "Cryptpad"  
4) You should be redirected to Cryptpad; check that you are logged into Cryptpad as User 1  

### Avatar check   
- [ ] Tested   

5) Check that you see an Avatar from OpenPaaS in Cryptpad (default is a colored background image with a letter)  
6) Go back to OpenPaaS (close the cryptpad tab)  
7) Go to `Profile > Edit`  
8) Upload a new Profile picture  
9) In the App menu, go back to Cryptpad  
10) Your Cryptpad avatar should now be your new OpenPaaS avatar  

### Share a new document   
- [ ] Tested   

11) Click on the "+" in your drive to create a new pad  
12) Click on the "Share" icon  
13) A tab "With OpenPaaS" should be present. Click on the "Share by email" button.  
14) In the composer window that opens, check that:  

- The content of the email is prefilled with a subject and body  
- The Cryptpad link contains `/edit/`  

15) Close the sharing window,   
16) Click on the share icon again, but select `View` in the radio button, then click on Share by email  
17) Check that the Cryptpad link in the email body contains `/view/`.   

### Types of pad available   
- [ ] Tested   

18) In Cryptpad, click on the 'app menu' on the left of your avatar.  
19) Check that you only have the following types of pad available: `Rich text, Code & Presentation`