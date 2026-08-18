import os
import zipfile

def create_clean_zip(output_filename='vernunt-app.zip'):
    # Whitelist directories and files to include
    include_dirs = {'src', 'public', 'scripts', '.github'}
    include_files = {
        'package.json', 'package-lock.json', 'tsconfig.json',
        'vite.config.ts', 'server.ts', 'index.html', 'Dockerfile',
        'cloudbuild.yaml', 'firebase.json', 'firebase-blueprint.json',
        'firestore.rules', 'tailwind.config.js', 'postcss.config.js',
        '.env.example', 'metadata.json'
    }
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for f in include_files:
            if os.path.exists(f):
                zipf.write(f, f)
        
        for d in include_dirs:
            if os.path.exists(d):
                for root, _, files in os.walk(d):
                    for file in files:
                        fp = os.path.join(root, file)
                        zipf.write(fp, fp)
                        
    size_kb = os.path.getsize(output_filename) / 1024
    print(f"Created {output_filename}: {size_kb:.2f} KB")

if __name__ == '__main__':
    create_clean_zip()
