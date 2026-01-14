# Contributing to Flowers For You 🌸

Thank you for your interest in contributing! This project welcomes new flower ideas, improvements, and bug fixes.

## 🌱 Ways to Contribute

### 1. Add a New Flower

The easiest way to contribute is to create a new flower experience!

**Requirements:**
- Must be a unique visual concept
- Should run smoothly (target 60fps)
- Must follow the existing page structure
- Include a loading state

**Steps:**

1. Fork the repository
2. Create a new file in `pages/` (e.g., `my-awesome-flower.html`)
3. Use an existing flower as a template:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Your Flower | Flowers For You 🌸</title>
       <link rel="stylesheet" href="../css/style.css">
   </head>
   <body>
       <div class="loading-overlay">
           <div class="loading-flower"></div>
           <p class="loading-text">Loading...</p>
       </div>

       <div class="flower-page">
           <nav class="page-nav">
               <a href="../index.html" class="back-btn">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M19 12H5M12 19l-7-7 7-7"/>
                   </svg>
                   Back to Garden
               </a>
           </nav>
           <div id="canvas-container" class="flower-canvas"></div>
           <div class="flower-info">
               <h1>Your Flower Name</h1>
               <p>A short, poetic description</p>
           </div>
       </div>

       <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
       <script src="../js/utils.js"></script>
       <script>
           // Your Three.js code here
           FlowerUtils.hideLoading(); // Call when ready
       </script>
   </body>
   </html>
   ```

4. Add your flower to the `flowers` array in `index.html`:
   ```javascript
   { 
       title: 'Short Title', 
       emoji: '🌸', 
       desc: 'One sentence description.', 
       type: 'Category', 
       exp: 'Experience Type', 
       link: 'pages/your-flower.html' 
   }
   ```

5. Submit a pull request!

### 2. Improve Existing Flowers

- Performance optimizations
- Visual enhancements
- Bug fixes
- Mobile responsiveness improvements

### 3. Documentation

- Fix typos
- Add code comments
- Improve README
- Create tutorials

### 4. Accessibility

- Keyboard navigation
- Screen reader support
- Reduced motion preferences

## 📋 Pull Request Guidelines

1. **One feature per PR** - Keep PRs focused
2. **Test on multiple devices** - Desktop, tablet, mobile
3. **Follow existing code style** - Match the formatting
4. **Write clear commit messages** - Describe what and why
5. **Update the README** if adding new features

## 🎨 Design Guidelines

- **Dark theme** - Black backgrounds, muted colors
- **Typography** - Cormorant Garamond for titles, Inter for body
- **Animations** - Smooth, 60fps, not jarring
- **Loading** - Always show loading state, hide with `FlowerUtils.hideLoading()`

## 🐛 Reporting Bugs

Open an issue with:
- Browser and device info
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 💬 Questions?

Open a discussion or issue - we're happy to help!

---

By contributing, you agree that your contributions will be licensed under the MIT License.
