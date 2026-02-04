import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Database, Key, Globe, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { TroubleshootingFAQ } from '@/components/settings/TroubleshootingFAQ';

export default function Settings() {
  return (
    <div className="p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your application configuration</p>
      </motion.div>

      <div className="space-y-6">
        {/* AI Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure the Copilot AI settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Copilot Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle between Mock AI and Real API</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mock</span>
                  <Switch defaultChecked />
                  <span className="text-sm text-muted-foreground">Real</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  disabled
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Set via environment variable OPENAI_API_KEY (Phase 2)
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dataverse Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Dataverse Integration
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  Phase 2
                </span>
              </CardTitle>
              <CardDescription>
                Configure Microsoft Dataverse connection for enterprise data sync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataverse-url">Dataverse URL</Label>
                  <Input
                    id="dataverse-url"
                    placeholder="https://org.crm.dynamics.com"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-id">Tenant ID</Label>
                  <Input
                    id="tenant-id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder="••••••••"
                    disabled
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <Button disabled variant="outline">
                  Test Connection
                </Button>
                <Button disabled>
                  Save Configuration
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dataverse integration will be available in Phase 2. The adapter interface is already implemented.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-save Changes</Label>
                  <p className="text-sm text-muted-foreground">Automatically save scenario changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Notifications</Label>
                  <p className="text-sm text-muted-foreground">Display toast notifications for actions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Use condensed table rows</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Troubleshooting FAQ */}
        <TroubleshootingFAQ />
      </div>
    </div>
  );
}
