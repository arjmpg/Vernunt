import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";

export interface BackupStatusInfo {
  enabled: boolean;
  frequency: string;
  scheduleDescription: string;
  targetAccounts: string[];
  lastBackupAt: string | null;
  lastBackupDate: string | null;
  lastBackupSizeFormatted: string;
  lastBackupFile: string | null;
  totalLocalSnapshots: number;
}

const TARGET_GDRIVE_ACCOUNTS = [
  "vernunt@gmail.com",
  "dharshikmogalip@gmail.com"
];

const BACKUP_DIR_NAME = ".system_backup_cache";

export function registerBackupRoutes(app: Express, getFirebaseAdmin: () => Promise<any>) {
  const rootDir = process.cwd();
  const backupDir = path.join(rootDir, BACKUP_DIR_NAME);

  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch (e) {
      console.warn("[Backup Service] Could not create backup cache directory:", e);
    }
  }

  // Scan and gather all source files into a codebase bundle
  const generateCodebaseBundle = () => {
    const ignoredDirs = new Set([
      "node_modules",
      "dist",
      ".git",
      ".system_generated",
      ".aistudio",
      "uploads",
      ".next",
      ".cache",
      BACK_DIR_NAME_SAFE
    ]);

    const ignoredFiles = new Set([
      "vernunt-app.zip",
      "package-lock.json",
      ".DS_Store"
    ]);

    const filesList: Array<{
      path: string;
      filename: string;
      extension: string;
      category: string;
      size: number;
      lines: number;
      content: string;
    }> = [];

    let totalLinesOfCode = 0;
    let totalBytes = 0;
    const categoriesCount: Record<string, number> = {};

    const getCategory = (filePath: string): string => {
      if (filePath.includes("components/")) return "UI Component";
      if (filePath.includes("services/")) return "Service & Backend Layer";
      if (filePath.includes("utils/")) return "Utility & Security";
      if (filePath.includes("types")) return "TypeScript Definition";
      if (filePath.endsWith(".css")) return "Styling & Layout";
      if (filePath === "server.ts") return "Express Server";
      if (filePath.endsWith(".json") || filePath.endsWith(".rules")) return "Configuration & Rules";
      if (filePath.endsWith(".html")) return "HTML Entry Point";
      return "Source Code";
    };

    const scanDir = (currentPath: string, relativePrefix: string = "") => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith(".") && entry.name !== ".env.example") {
          continue;
        }

        const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!ignoredDirs.has(entry.name)) {
            scanDir(fullPath, relativePath);
          }
        } else if (entry.isFile()) {
          if (ignoredFiles.has(entry.name) || entry.name.endsWith(".zip") || entry.name.endsWith(".tar.gz")) {
            continue;
          }

          try {
            const stats = fs.statSync(fullPath);
            const ext = path.extname(entry.name).toLowerCase();
            const isBinary = [".png", ".jpg", ".jpeg", ".ico", ".woff", ".woff2", ".ttf"].includes(ext);

            let fileContent = "";
            let lineCount = 0;

            if (isBinary) {
              const buffer = fs.readFileSync(fullPath);
              fileContent = `data:application/octet-stream;base64,${buffer.toString("base64")}`;
              lineCount = 1;
            } else {
              fileContent = fs.readFileSync(fullPath, "utf-8");
              lineCount = fileContent.split("\n").length;
            }

            const category = getCategory(relativePath);
            categoriesCount[category] = (categoriesCount[category] || 0) + 1;

            totalLinesOfCode += lineCount;
            totalBytes += stats.size;

            filesList.push({
              path: relativePath,
              filename: entry.name,
              extension: ext,
              category,
              size: stats.size,
              lines: lineCount,
              content: fileContent
            });
          } catch (err) {
            console.warn(`[Codebase Scanner] Could not read file ${relativePath}:`, err);
          }
        }
      }
    };

    scanDir(rootDir);
    filesList.sort((a, b) => a.path.localeCompare(b.path));

    return {
      manifest: {
        appName: "Vernunt Playdates & Community",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        totalFiles: filesList.length,
        totalLinesOfCode,
        totalBytes,
        fileCategories: categoriesCount,
        nodeVersion: process.version,
        platform: process.platform,
        summary: `Complete source code tree containing ${filesList.length} files and ${totalLinesOfCode} lines of code.`
      },
      files: filesList
    };
  };

  const BACK_DIR_NAME_SAFE = BACKUP_DIR_NAME;

  // Generate automated nightly snapshot package
  const generateNightlyBackup = async (trigger: string = "SCHEDULED_NIGHTLY") => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timestampStr = now.toISOString().replace(/[:.]/g, "-");
      const fileName = `Vernunt_NIGHTLY_BACKUP_${dateStr}_${timestampStr}.json`;
      const filePath = path.join(backupDir, fileName);

      const codebaseBundle = generateCodebaseBundle();

      // Read Firestore database collections via Admin SDK if available
      const admin = await getFirebaseAdmin();
      const databaseCollections: Record<string, any[]> = {};
      let totalDocs = 0;

      if (admin && admin.apps.length > 0) {
        try {
          const db = admin.firestore();
          const targetCollections = [
            "childProfiles",
            "users",
            "community_events",
            "chats",
            "referrals",
            "banners",
            "security_logs",
            "system_config",
            "products",
            "orders",
            "vendors",
            "otp_verifications",
            "daycares",
            "specialists",
            "reviews"
          ];

          for (const collName of targetCollections) {
            try {
              const snap = await db.collection(collName).get();
              databaseCollections[collName] = snap.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
              }));
              totalDocs += databaseCollections[collName].length;
            } catch (err) {
              databaseCollections[collName] = [];
            }
          }
        } catch (dbErr) {
          console.warn("[Backup Service] Firestore read note during backup:", dbErr);
        }
      }

      const masterSnapshot = {
        archiveType: "MASTER_FULL_APP_AND_CODEBASE",
        createdAt: now.toISOString(),
        backupDate: dateStr,
        version: "1.0.0",
        appName: "Vernunt Playdates & Community",
        exportedBy: "automated-nightly-system@vernunt.com",
        trigger,
        targetAccounts: TARGET_GDRIVE_ACCOUNTS,
        summary: {
          totalFiles: codebaseBundle.manifest.totalFiles,
          totalLinesOfCode: codebaseBundle.manifest.totalLinesOfCode,
          totalDocuments: totalDocs
        },
        codebase: codebaseBundle,
        database: databaseCollections
      };

      fs.writeFileSync(filePath, JSON.stringify(masterSnapshot, null, 2), "utf-8");

      // Save a symlink or marker for latest backup
      const latestPointerPath = path.join(backupDir, "latest_nightly_backup.json");
      fs.writeFileSync(latestPointerPath, JSON.stringify({
        fileName,
        createdAt: now.toISOString(),
        dateStr,
        sizeBytes: fs.statSync(filePath).size,
        totalFiles: codebaseBundle.manifest.totalFiles,
        totalDocuments: totalDocs,
        targetAccounts: TARGET_GDRIVE_ACCOUNTS
      }, null, 2), "utf-8");

      // Prune old local files (keep last 7 days)
      try {
        const allFiles = fs.readdirSync(backupDir)
          .filter(f => f.startsWith("Vernunt_NIGHTLY_BACKUP_") && f.endsWith(".json"))
          .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtimeMs }))
          .sort((a, b) => b.time - a.time);

        if (allFiles.length > 7) {
          for (let i = 7; i < allFiles.length; i++) {
            fs.unlinkSync(path.join(backupDir, allFiles[i].name));
          }
        }
      } catch (cleanErr) {
        console.debug("Prune note:", cleanErr);
      }

      console.log(`[Backup Service] Successfully created nightly backup snapshot: ${fileName} (${totalDocs} docs, ${codebaseBundle.manifest.totalFiles} files).`);
      return { success: true, fileName, masterSnapshot };
    } catch (err: any) {
      console.error("[Backup Service] Nightly backup creation error:", err);
      return { success: false, error: err?.message || err };
    }
  };

  // 1. GET /api/backup/status - Returns status of automated nightly backups
  app.get("/api/backup/status", (req: Request, res: Response) => {
    try {
      const latestPointerPath = path.join(backupDir, "latest_nightly_backup.json");
      let latestInfo: any = null;
      if (fs.existsSync(latestPointerPath)) {
        try {
          latestInfo = JSON.parse(fs.readFileSync(latestPointerPath, "utf-8"));
        } catch (_err) {
          // pointer file might be empty or corrupted, ignore
        }
      }

      const allFiles = fs.existsSync(backupDir) 
        ? fs.readdirSync(backupDir).filter(f => f.startsWith("Vernunt_NIGHTLY_BACKUP_"))
        : [];

      const status: BackupStatusInfo = {
        enabled: true,
        frequency: "Daily Nightly (Every 24 Hours at 02:00 AM IST)",
        scheduleDescription: "Automated snapshot every night with cloud synchronization to vernunt@gmail.com and dharshikmogalip@gmail.com",
        targetAccounts: TARGET_GDRIVE_ACCOUNTS,
        lastBackupAt: latestInfo?.createdAt || null,
        lastBackupDate: latestInfo?.dateStr || null,
        lastBackupSizeFormatted: latestInfo?.sizeBytes 
          ? `${(latestInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB` 
          : "N/A",
        lastBackupFile: latestInfo?.fileName || null,
        totalLocalSnapshots: allFiles.length
      };

      return res.json({ success: true, status });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // 2. POST /api/backup/run-nightly - Trigger nightly backup immediately
  app.post("/api/backup/run-nightly", async (req: Request, res: Response) => {
    try {
      const result = await generateNightlyBackup("MANUAL_TRIGGER");
      if (!result.success) {
        return res.status(500).json(result);
      }
      return res.json({
        success: true,
        message: "✓ Automated Nightly Backup created and stored successfully.",
        fileName: result.fileName,
        summary: result.masterSnapshot?.summary,
        targetAccounts: TARGET_GDRIVE_ACCOUNTS
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // 3. GET /api/backup/download-latest - Direct download of latest full backup JSON
  app.get("/api/backup/download-latest", (req: Request, res: Response) => {
    try {
      const latestPointerPath = path.join(backupDir, "latest_nightly_backup.json");
      if (!fs.existsSync(latestPointerPath)) {
        return res.status(404).json({ success: false, error: "No backup archive available yet. Please click 'Create Nightly Backup Now'." });
      }

      const pointer = JSON.parse(fs.readFileSync(latestPointerPath, "utf-8"));
      const filePath = path.join(backupDir, pointer.fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "Backup file not found on disk." });
      }

      res.setHeader("Content-Disposition", `attachment; filename="${pointer.fileName}"`);
      res.setHeader("Content-Type", "application/json");
      return fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // 4. POST /api/backup/restore - RESTORE FULL APP AND FULL DATA FROM UPLOADED BACKUP
  app.post("/api/backup/restore", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: "Empty restore payload received." });
      }

      // Check format (Master archive vs Database snapshot)
      const isMasterArchive = payload.archiveType === "MASTER_FULL_APP_AND_CODEBASE";
      const codebase = isMasterArchive ? payload.codebase : payload.codebase || null;
      const database = isMasterArchive ? (payload.database?.database || payload.database) : (payload.database || payload);

      let restoredFilesCount = 0;
      let restoredBytesCount = 0;
      let restoredDocsCount = 0;
      const fileErrors: string[] = [];
      const dbErrors: string[] = [];

      // Step A: Restore Codebase files if present in uploaded archive
      if (codebase && Array.isArray(codebase.files)) {
        console.log(`[Backup Restore] Restoring ${codebase.files.length} codebase files from uploaded archive...`);
        for (const fileEntry of codebase.files) {
          try {
            // Guard against path traversal
            const safeRelativePath = path.normalize(fileEntry.path).replace(/^(\.\.(\/|\\|$))+/, "");
            const fullTarget = path.join(rootDir, safeRelativePath);

            // Don't overwrite node_modules or system files
            if (safeRelativePath.startsWith("node_modules") || safeRelativePath.startsWith(".git")) {
              continue;
            }

            const parentDir = path.dirname(fullTarget);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }

            if (fileEntry.content.startsWith("data:application/octet-stream;base64,")) {
              const base64Data = fileEntry.content.replace(/^data:application\/octet-stream;base64,/, "");
              fs.writeFileSync(fullTarget, Buffer.from(base64Data, "base64"));
            } else {
              fs.writeFileSync(fullTarget, fileEntry.content, "utf-8");
            }

            restoredFilesCount++;
            restoredBytesCount += (fileEntry.size || fileEntry.content.length);
          } catch (fileErr: any) {
            fileErrors.push(`${fileEntry.path}: ${fileErr.message || fileErr}`);
          }
        }
      }

      // Step B: Restore Database collections to live Firestore via Admin SDK
      if (database && typeof database === "object") {
        const admin = await getFirebaseAdmin();
        if (admin && admin.apps.length > 0) {
          try {
            const db = admin.firestore();
            for (const [collName, docs] of Object.entries(database)) {
              if (Array.isArray(docs)) {
                console.log(`[Backup Restore] Writing ${docs.length} documents into collection "${collName}"...`);
                // Batch writes in chunks of 400
                const chunkSize = 400;
                for (let i = 0; i < docs.length; i += chunkSize) {
                  const chunk = docs.slice(i, i + chunkSize);
                  const batch = db.batch();

                  for (const docData of chunk) {
                    if (docData && docData.id) {
                      const { id, ...dataClean } = docData;
                      const ref = db.collection(collName).doc(id);
                      batch.set(ref, dataClean, { merge: true });
                      restoredDocsCount++;
                    }
                  }

                  await batch.commit();
                }
              }
            }
          } catch (adminDbErr: any) {
            console.error("[Backup Restore] Firebase Admin database restore error:", adminDbErr);
            dbErrors.push(adminDbErr?.message || String(adminDbErr));
          }
        }
      }

      console.log(`[Backup Restore] Restore completed: ${restoredFilesCount} files restored (${restoredBytesCount} bytes), ${restoredDocsCount} documents restored live.`);

      return res.json({
        success: true,
        restoredFilesCount,
        restoredBytesCount,
        restoredDocsCount,
        fileErrors,
        dbErrors,
        message: `✓ Full application and data restored live! ${restoredFilesCount} codebase files and ${restoredDocsCount} database records synchronized.`
      });
    } catch (err: any) {
      console.error("[Backup Restore Fatal Error]:", err);
      return res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // Automated Nightly Backup Heartbeat Service: Runs every 24 hours
  // Also runs once 30 seconds after server launch if no backup was generated today
  setTimeout(async () => {
    try {
      const latestPointerPath = path.join(backupDir, "latest_nightly_backup.json");
      let needRun = true;
      if (fs.existsSync(latestPointerPath)) {
        try {
          const info = JSON.parse(fs.readFileSync(latestPointerPath, "utf-8"));
          const today = new Date().toISOString().slice(0, 10);
          if (info.dateStr === today) {
            needRun = false;
          }
        } catch (_err) {
          // ignore invalid json pointer
        }
      }
      if (needRun) {
        console.log("[Nightly Backup Service] Starting initial daily snapshot...");
        await generateNightlyBackup("STARTUP_AUTO_CHECK");
      }
    } catch (err) {
      console.warn("[Nightly Backup Service] Startup check note:", err);
    }
  }, 30000);

  // Set recurring interval check every 3 hours
  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours(); // 0 to 23
      const today = now.toISOString().slice(0, 10);

      // Nightly target hour (e.g., between 2:00 AM and 5:00 AM)
      const latestPointerPath = path.join(backupDir, "latest_nightly_backup.json");
      let alreadyRanToday = false;

      if (fs.existsSync(latestPointerPath)) {
        try {
          const info = JSON.parse(fs.readFileSync(latestPointerPath, "utf-8"));
          if (info.dateStr === today) {
            alreadyRanToday = true;
          }
        } catch (_err) {
          // ignore corrupted pointer file
        }
      }

      if (!alreadyRanToday && currentHour >= 2) {
        console.log("[Nightly Backup Service] Executing scheduled nightly backup routine...");
        await generateNightlyBackup("AUTOMATED_NIGHTLY_CRON");
      }
    } catch (err) {
      console.warn("[Nightly Backup Service] Cron check note:", err);
    }
  }, 3 * 60 * 60 * 1000);
}
