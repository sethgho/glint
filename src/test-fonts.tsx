import { loadBuiltinFonts } from 'typlit';

async function test() {
  try {
    console.log('Loading fonts...');
    await loadBuiltinFonts();
    console.log('Fonts loaded successfully');
  } catch (error) {
    console.error('Font loading failed:', error);
  }
}

test();
