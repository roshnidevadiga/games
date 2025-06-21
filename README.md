# 🏓 Motion Ping Pong

A fun and interactive ping pong game controlled by head movements using your webcam! Built with React and modern web technologies.

## 🎮 Features

- **Head Motion Control**: Move your head left and right to control the paddle
- **Real-time Camera Tracking**: Uses webcam for motion detection
- **Game Controls**: Start, pause, stop, and reset functionality
- **Speed Control**: Adjust ball speed from 1x to 3x
- **Enhanced Ball Physics**: Realistic ball trajectory based on paddle hit position
- **Countdown Timer**: 3-2-1 countdown before game starts
- **Responsive Design**: Works on desktop and mobile devices
- **Premium Dark Theme**: Beautiful glass morphism UI

## 🚀 Live Demo

Visit the live game: [https://YOUR_USERNAME.github.io/games](https://YOUR_USERNAME.github.io/games)

## 🛠️ Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool
- **Canvas API** - Game rendering
- **WebRTC** - Camera access
- **CSS3** - Styling and animations

## 📱 How to Play

1. **Allow camera access** when prompted
2. **Start the camera** using the "Start Camera" button
3. **Click "Start Game"** to begin
4. **Move your head left and right** to control the paddle
5. **Hit the ball** to score points
6. **Avoid missing** the ball to keep playing!

### Controls

- **Head Movement**: Control paddle position
- **Mouse/Touch**: Fallback control method
- **Speed Slider**: Adjust ball speed (1x-3x)
- **Game Buttons**: Start, Pause, Stop, Reset

## 🔧 Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/games.git
cd games
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

## 🌐 Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Update package.json**: Replace `YOUR_USERNAME` in the homepage URL with your GitHub username
2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"
3. **Push to main branch**: The deployment will happen automatically

### Manual Deployment

You can also deploy manually using:

```bash
npm run deploy
```

## 📁 Project Structure

```
games/
├── src/
│   ├── components/
│   │   ├── HeadTracker.jsx    # Camera and motion detection
│   │   ├── PingPongGame.jsx   # Main game logic
│   │   └── PingPongGame.css   # Game styling
│   ├── App.jsx                # Root component
│   └── main.jsx              # Entry point
├── public/                   # Static assets
├── .github/workflows/        # GitHub Actions
└── package.json             # Dependencies and scripts
```

## 🎯 Game Mechanics

- **Ball Physics**: Realistic bouncing with speed conservation
- **Paddle Collision**: 5 zones with different trajectory angles
- **Scoring**: Points increase with each successful hit
- **Game Over**: When ball passes the paddle
- **Speed Control**: Real-time ball speed adjustment

## 🔒 Privacy

- **Camera Access**: Used only for head tracking, no data is stored or transmitted
- **Local Processing**: All motion detection happens in your browser
- **No Server**: Pure client-side application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

- Camera access may require HTTPS in production
- Some mobile browsers may have limited camera support
- Head tracking accuracy depends on lighting conditions

## 🔮 Future Enhancements

- [ ] Multiplayer support
- [ ] Different game modes
- [ ] Leaderboard system
- [ ] Sound effects
- [ ] Power-ups and special effects
- [ ] AI opponent

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/YOUR_USERNAME/games/issues) page
2. Create a new issue if needed
3. Provide details about your browser and device

---

**Enjoy playing Motion Ping Pong! 🏓**
