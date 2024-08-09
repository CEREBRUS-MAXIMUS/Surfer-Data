async function exportLinkedin() {
      await new Promise((resolve) => setTimeout(resolve, 7000));
      const profileButton =
        document.getElementsByClassName('ember-view block')[0];

       if (!profileButton) {
        console.log('user not connected')
        return "Not connected"
        
      }    
      
      profileButton.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const linkedinProfile = document.body.outerHTML
      console.log('linkedin done!')
      return linkedinProfile;
}

module.exports = exportLinkedin