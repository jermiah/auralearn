/**
 * Dynamic Color Palette Generation for Radar Charts
 * Colors generated from domain ID hash - NO HARDCODED COLORS
 */

/**
 * Generate a consistent color from a string ID using hash
 */
export function getDomainColor(domainId: string, saturation = 70, lightness = 50): string {
  // Simple string hash function
  let hash = 0;
  for (let i = 0; i < domainId.length; i++) {
    const char = domainId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate hue from hash (0-360)
  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate color with alpha transparency
 */
export function getDomainColorWithAlpha(
  domainId: string,
  alpha: number,
  saturation = 70,
  lightness = 50
): string {
  let hash = 0;
  for (let i = 0; i < domainId.length; i++) {
    const char = domainId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Generate a palette of N distinct colors
 */
export function generateColorPalette(count: number, saturation = 70, lightness = 50): string[] {
  const colors: string[] = [];
  const goldenRatio = 0.618033988749895; // For even color distribution

  for (let i = 0; i < count; i++) {
    const hue = (i * goldenRatio * 360) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}

/**
 * Get color for student category (using existing category config)
 */
export function getStudentCategoryColor(category: string): string {
  const categoryColorMap: Record<string, string> = {
    slow_processing: 'hsl(200, 70%, 50%)',      // Blue
    fast_processor: 'hsl(45, 70%, 50%)',        // Yellow
    high_energy: 'hsl(150, 70%, 50%)',          // Green
    visual_learner: 'hsl(280, 70%, 50%)',       // Purple
    logical_learner: 'hsl(220, 70%, 50%)',      // Indigo
    sensitive_low_confidence: 'hsl(340, 70%, 50%)', // Pink
    easily_distracted: 'hsl(15, 70%, 50%)',     // Red-Orange
    needs_repetition: 'hsl(180, 70%, 50%)',     // Teal
  };

  return categoryColorMap[category] || getDomainColor(category);
}

/**
 * Get color for cognitive domain
 */
export function getCognitiveDomainColor(domain: string): string {
  const domainColorMap: Record<string, string> = {
    processing_speed: 'hsl(200, 70%, 55%)',
    working_memory: 'hsl(280, 70%, 55%)',
    attention_focus: 'hsl(30, 70%, 55%)',
    learning_style: 'hsl(150, 70%, 55%)',
    self_efficacy: 'hsl(340, 70%, 55%)',
    motivation_engagement: 'hsl(60, 70%, 55%)',
  };

  return domainColorMap[domain] || getDomainColor(domain);
}

/**
 * Get color for group type
 */
export function getGroupColor(groupName: string): string {
  const groupColors: Record<string, string> = {
    Support: 'hsl(0, 70%, 55%)',      // Red
    Core: 'hsl(45, 70%, 55%)',        // Yellow
    Advanced: 'hsl(120, 70%, 55%)',   // Green
  };

  return groupColors[groupName] || getDomainColor(groupName);
}

/**
 * Generate gradient colors for multi-layer radar
 */
export function getRadarGradient(baseColor: string, steps: number): string[] {
  // Extract HSL values from base color
  const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);

  if (!hslMatch) {
    // Fallback to generating new colors
    return generateColorPalette(steps);
  }

  const [, h, s, l] = hslMatch;
  const hue = parseInt(h);
  const saturation = parseInt(s);
  const baseLightness = parseInt(l);

  const gradient: string[] = [];

  for (let i = 0; i < steps; i++) {
    const lightness = baseLightness + (i * 10 - steps * 5);
    gradient.push(`hsl(${hue}, ${saturation}%, ${Math.max(20, Math.min(80, lightness))}%)`);
  }

  return gradient;
}

/**
 * Get contrasting text color for background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Extract lightness from HSL
  const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);

  if (!hslMatch) {
    return '#000000';
  }

  const lightness = parseInt(hslMatch[3]);
  return lightness > 50 ? '#000000' : '#FFFFFF';
}
