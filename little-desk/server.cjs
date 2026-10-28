// Keep the existing start command while serving the complete Pages artifact.
import('../scripts/build.mjs').then(() => import('../scripts/serve.mjs')).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
