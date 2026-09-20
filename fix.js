const fs = require('fs');
let html = fs.readFileSync('public/ilan-detay.html', 'utf8');

html = html.replace('<main class="hidden pt-16" id="main-content">', '<main class="hidden pt-20 lg:pt-24" id="main-content">');
html = html.replace('<h1 class="mt-4 font-brand text-[40px]', '<h1 class="mt-4 font-brand text-[32px] sm:text-[40px]');
html = html.replace('<div class="mb-7 flex items-end justify-between">', '<div class="mb-7 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">');
html = html.replace('<h2 class="mt-3 font-brand text-[27px]', '<h2 class="mt-3 font-brand text-[24px] sm:text-[27px]'); // property features
html = html.replace('<h2 class="mt-3 font-brand text-[27px]', '<h2 class="mt-3 font-brand text-[24px] sm:text-[27px]'); // video
html = html.replace('<h2 class="mt-3 font-brand text-[27px]', '<h2 class="mt-3 font-brand text-[24px] sm:text-[27px]'); // features
html = html.replace('<h2 class="mt-3 font-brand text-[27px]', '<h2 class="mt-3 font-brand text-[24px] sm:text-[27px]'); // description
html = html.replace('<div class="flex items-end justify-between">', '<div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">'); // related 
html = html.replace('<h2 class="mt-3 font-brand text-[27px]', '<h2 class="mt-3 font-brand text-[24px] sm:text-[27px]'); // related title

html = html.replace('class="fixed bottom-6 right-6 z-50 flex h-14 w-14', 'class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14');
html = html.replace('<iconify-icon icon="ic:baseline-whatsapp" class="text-3xl"></iconify-icon>', '<iconify-icon icon="ic:baseline-whatsapp" class="text-2xl sm:text-3xl"></iconify-icon>');

fs.writeFileSync('public/ilan-detay.html', html);
console.log('Fixed html');
