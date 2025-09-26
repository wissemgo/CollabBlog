/**
 * Home Component - Landing page for CollabBlog
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to CollabBlog</h1>
          <p class="hero-subtitle">
            A modern collaborative blogging platform built with the MEAN stack
          </p>
          <div class="hero-buttons">
            <button class="btn btn-primary">Get Started</button>
            <button class="btn btn-outline">Learn More</button>
          </div>
        </div>
      </div>
      
      <div class="features-section">
        <h2>Key Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-time Comments</h3>
            <p>Engage with readers through live comments and nested replies</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔐</div>
            <h3>Secure Authentication</h3>
            <p>JWT-based authentication with role-based access control</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3>Rich Text Editor</h3>
            <p>Create beautiful articles with our advanced editor</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Track article performance and user engagement</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .hero-section {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      text-align: center;
      padding: 2rem;
    }
    
    .hero-content {
      max-width: 800px;
    }
    
    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #fff, #f0f0f0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .hero-subtitle {
      font-size: 1.3rem;
      margin-bottom: 2rem;
      opacity: 0.9;
      line-height: 1.6;
    }
    
    .hero-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 12px 30px;
      border-radius: 50px;
      font-size: 1.1rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    
    .btn-primary {
      background: #fff;
      color: #667eea;
      border-color: #fff;
    }
    
    .btn-primary:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
    
    .btn-outline {
      background: transparent;
      color: #fff;
      border-color: #fff;
    }
    
    .btn-outline:hover {
      background: #fff;
      color: #667eea;
      transform: translateY(-2px);
    }
    
    .features-section {
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .features-section h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      font-weight: 600;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .feature-card {
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 20px;
      text-align: center;
      transition: transform 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .feature-card:hover {
      transform: translateY(-10px);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .feature-card h3 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    
    .feature-card p {
      opacity: 0.9;
      line-height: 1.6;
    }
    
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .hero-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .btn {
        width: 200px;
      }
    }
  `]
})
export class HomeComponent {
  constructor() {}
}