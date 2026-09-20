const fs = require('fs');
let js = fs.readFileSync('public/js/app.js', 'utf8');

js = js.replace('<div class="flex items-center gap-3 font-body text-[14px] text-anvil"><iconify-icon icon="lucide:check" class="text-[18px] text-mint"></iconify-icon> </div>', '<div class="flex items-start gap-3 font-body text-[14px] text-anvil"><iconify-icon icon="lucide:check" class="text-[18px] text-mint flex-shrink-0 mt-0.5"></iconify-icon> <span></span></div>');

fs.writeFileSync('public/js/app.js', js);
console.log('Fixed app.js');
