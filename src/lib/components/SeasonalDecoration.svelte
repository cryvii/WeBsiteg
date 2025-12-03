<script lang="ts">
  export let name: string;
  
  // Logic to determine current month/season
  const month = new Date().getMonth(); // 0-11
  let season = 'default';
  
  if (month === 9) season = 'halloween'; // Oct
  else if (month === 11) season = 'christmas'; // Dec
  else if (month >= 2 && month <= 4) season = 'spring'; // Mar-May
  
  // In a real app, we would load from /themes/{season}/{name}.png
  // For this demo, we'll use placeholders or CSS colors
  
  const colors: Record<string, string> = {
    default: '#ff6b35',
    halloween: '#ff6600',
    christmas: '#cc0000',
    spring: '#00cc66'
  };
  
  const color = colors[season] || colors.default;
</script>

<div class="seasonal-decoration" style="--season-color: {color}">
  <!-- Placeholder for the asset -->
  <div 
    class="w-20 h-20 border-2 border-dashed flex items-center justify-center text-xs text-center font-mono opacity-60 dark:opacity-40 transition-opacity" 
    style="border-color: {color}; color: {color}"
  >
    {season}/{name}
  </div>
</div>
