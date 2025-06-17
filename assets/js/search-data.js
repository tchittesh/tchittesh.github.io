// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "side quests",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "page under construction :construction:",
          section: "Navigation",
          handler: () => {
            window.location.href = "/assets/pdf/cv.pdf";
          },
        },{id: "post-interactive-multi-view-stereo-simulator",
        
          title: "Interactive Multi-View Stereo Simulator",
        
        description: "Explore how 3D reconstruction uncertainties change with varying camera parameters and configurations",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/stereo-simulator/";
          
        },
      },{id: "post-unpacking-the-log-odds-update-rule",
        
          title: "Unpacking the Log Odds Update Rule",
        
        description: "Developing intuition for the inverse sensor model and the prior term, plus notes on practical usage",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/log-odds/";
          
        },
      },{id: "news-awarded-the-2025-nsf-graduate-research-fellowship",
          title: 'Awarded the 2025 NSF Graduate Research Fellowship',
          description: "",
          section: "News",},{id: "news-serving-as-a-reviewer-for-neurips-2025",
          title: 'Serving as a reviewer for NeurIPS 2025',
          description: "",
          section: "News",},{id: "projects-scylla-keyboard",
          title: 'scylla keyboard',
          description: "a split ergonomic curved mechanical keyboard",
          section: "Projects",handler: () => {
              window.location.href = "/projects/scylla_keyboard/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%74%63%68%69%74%74%65%73%68@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/tchittesh", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/chittesh-thavamani", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=ILmOt0AAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
