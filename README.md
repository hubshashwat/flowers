# 🌸 Flowers For You

A collection of 50 unique, interactive 3D flower experiences built with Three.js. Each flower is a mini art piece with its own visual style, animations, and mood.

![Flowers For You](https://img.shields.io/badge/flowers-50-pink)
![Three.js](https://img.shields.io/badge/Three.js-r128-black)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **50 Unique Flowers** - From photorealistic roses to quantum superposition blooms
- **Dark Luxury Aesthetic** - Editorial design with elegant typography
- **Fully Responsive** - Desktop, tablet, and mobile optimized
- **Touch Gestures** - Swipe to navigate on mobile
- **No Build Step** - Pure HTML, CSS, and JavaScript

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/hubshashwat/flowers.git
cd flowers

# Start a local server (Python)
python -m http.server 8000

# Or use any static file server
npx serve .
```

Then open `http://localhost:8000` in your browser.

## 🌺 Flower Categories

| Category | Examples |
|----------|----------|
| **Nature** | Rose, Tulip, Moonflower |
| **Physics** | Quantum, Magnetic, Wind-Tunnel |
| **Materials** | Glass, Liquid Metal, Fabric |
| **Art Styles** | Watercolor, Origami, Wireframe |
| **Elements** | Fire (Phoenix), Ice, Cloud |
| **Sci-Fi** | Neon Cyberpunk, Molecular, Meteor |

## 📁 Project Structure

```
flowers/
├── index.html          # Landing page with flower gallery
├── css/
│   └── style.css       # Shared styles for flower pages
├── js/
│   └── utils.js        # Three.js utilities
└── pages/
    ├── photorealistic-rose.html
    ├── quantum-flower.html
    └── ... (50 flower pages)
```

## 🎨 Adding a New Flower

1. Create a new file in `pages/` (e.g., `my-flower.html`)
2. Use the existing flower pages as templates
3. Add your flower to the `flowers` array in `index.html`
4. Pick a unique emoji and write a short description

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 🛠️ Tech Stack

- **Three.js** - 3D rendering
- **Vanilla CSS** - Styling (no frameworks)
- **Google Fonts** - Cormorant Garamond & Inter

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

Ideas for contributions:
- New flower concepts
- Visual improvements to existing flowers
- Performance optimizations
- Accessibility improvements
- Documentation

## 💐 Credits

Created with love. Each flower is a small meditation on beauty and code.

---

**[View Live Demo →](https://hubshashwat.github.io/flowers/)**
