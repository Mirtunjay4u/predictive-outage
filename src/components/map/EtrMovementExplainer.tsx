 import { useState } from "react";
 import { format } from "date-fns";
 import { TrendingUp, Loader2, AlertCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { Separator } from "@/components/ui/separator";
 import { toast } from "sonner";
 import { supabase } from "@/integrations/supabase/client";
 import { useEventStatusHistory, type EventStatusSnapshot } from "@/hooks/useEventStatusHistory";
 import type { ScenarioWithIntelligence } from "@/types/scenario";
 import type { CopilotResponse } from "@/types/copilot";
 
 interface EtrMovementExplainerProps {
   event: ScenarioWithIntelligence;
 }
 
 export function EtrMovementExplainer({ event }: EtrMovementExplainerProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [response, setResponse] = useState<CopilotResponse | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [copied, setCopied] = useState(false);
 
   const { data: statusHistory = [], isLoading: historyLoading } = useEventStatusHistory(event.id);
 
   const hasHistory = statusHistory.length > 0;
 
   const handleToggle = async () => {
     if (isOpen) {
       setIsOpen(false);
       return;
     }
 
     setIsLoading(true);
     setError(null);
 
     try {
       // Build specialized ETR movement prompt
       const analysisPrompt = buildEtrMovementPrompt(event, statusHistory);
 
       const { data, error: fnError } = await supabase.functions.invoke("copilot", {
         body: {
           mode: "DEMO",
           user_message: analysisPrompt,
           scenario_id: event.id,
           scenario: {
             scenario_name: event.name,
             lifecycle_stage: event.lifecycle_stage,
             outage_type: event.outage_type,
             etr_earliest: event.etr_earliest,
             etr_expected: event.etr_expected,
             etr_latest: event.etr_latest,
             etr_confidence: event.etr_confidence,
             etr_risk_level: event.etr_risk_level,
             etr_band_hours: event.etr_band_hours,
             critical_runway_status: event.critical_runway_status,
             has_critical_load: event.has_critical_load,
             critical_load_types: event.critical_load_types,
             backup_runtime_remaining_hours: event.backup_runtime_remaining_hours,
             requires_escalation: event.requires_escalation,
           },
           constraints: [
             "Focus on explaining WHY the ETR changed over time",
             "Reference specific timestamps and change notes from the history",
             "Do not recommend switching or field actions",
             "Use advisory language throughout",
             "If history is incomplete, explain uncertainty clearly",
           ],
         },
       });
 
       if (fnError) throw fnError;
 
       setResponse(data as CopilotResponse);
       setIsOpen(true);
     } catch (err) {
       console.error("ETR Movement Explainer error:", err);
       setError(err instanceof Error ? err.message : "Failed to generate explanation");
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleCopy = async () => {
     if (!response) return;
 
     const textContent = formatResponseForCopy(response);
     await navigator.clipboard.writeText(textContent);
     setCopied(true);
     toast.success("Explanation copied to clipboard");
     setTimeout(() => setCopied(false), 2000);
   };
 
   return (
     <section className="mt-2">
       <Button
         variant="outline"
         size="sm"
         className="w-full gap-2 h-10 text-xs font-medium"
         onClick={handleToggle}
         disabled={isLoading || historyLoading}
       >
         {isLoading ? (
           <Loader2 className="w-3.5 h-3.5 animate-spin" />
         ) : (
           <TrendingUp className="w-3.5 h-3.5" />
         )}
         Explain why the ETR changed
         {!isLoading && (isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />)}
       </Button>
 
       {/* No history indicator */}
       {!hasHistory && !isLoading && (
         <p className="text-[10px] text-muted-foreground text-center mt-2">
           No ETR change history available for this event
         </p>
       )}
 
       <AnimatePresence>
         {/* Error State */}
         {error && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
             <div className="mt-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
               <div className="flex items-center gap-2 mb-2">
                 <AlertCircle className="w-4 h-4" />
                 <span className="text-sm font-medium">Error</span>
               </div>
               <p className="text-sm">{error}</p>
               <Button variant="ghost" size="sm" className="mt-2" onClick={() => setError(null)}>
                 Dismiss
               </Button>
             </div>
           </motion.div>
         )}
 
         {/* Response Display */}
         {isOpen && response && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="overflow-hidden"
           >
             <div className="mt-3 p-4 rounded-lg bg-muted/40 border border-border space-y-4">
               {/* Mode Banner */}
               <div className="flex items-center justify-between">
                 <div className="px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
                   <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                     {response.mode_banner}
                   </span>
                 </div>
                 <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5" onClick={handleCopy}>
                   {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                   <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
                 </Button>
               </div>
 
               {/* Framing Line */}
               {response.framing_line && (
                 <p className="text-sm font-medium text-foreground leading-relaxed border-l-2 border-muted-foreground/30 pl-3">
                   {response.framing_line}
                 </p>
               )}
 
               {/* Insights */}
               <div className="space-y-4">
                 {response.insights.map((insight, index) => (
                   <div key={index}>
                     <h4 className="text-xs font-semibold text-foreground mb-2 flex items-start gap-2">
                       <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                         {String.fromCharCode(65 + index)}
                       </span>
                       <span>{insight.title}</span>
                     </h4>
                     <ul className="space-y-1.5 ml-7">
                       {insight.bullets.map((bullet, bulletIdx) => (
                         <li key={bulletIdx} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                           <span className="text-muted-foreground/50 mt-0.5">•</span>
                           <span>{bullet}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
 
               {/* Assumptions */}
               {response.assumptions && response.assumptions.length > 0 && (
                 <>
                   <Separator className="my-3" />
                   <div className="p-3 rounded bg-muted/50 border border-border">
                     <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                       Assumptions
                     </h4>
                     <ul className="space-y-1">
                       {response.assumptions.map((assumption, idx) => (
                         <li key={idx} className="text-[11px] text-muted-foreground flex items-start gap-2">
                           <span className="mt-0.5">•</span>
                           <span>{assumption}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </>
               )}
 
               {/* Source Notes */}
               {response.source_notes && response.source_notes.length > 0 && (
                 <div className="p-3 rounded bg-muted/50 border border-border">
                   <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                     Source Notes
                   </h4>
                   <ul className="space-y-1">
                     {response.source_notes.map((note, idx) => (
                       <li key={idx} className="text-[11px] text-muted-foreground">
                         {note}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
 
               {/* Safety Disclaimer */}
               <div className="p-2.5 rounded bg-warning/5 border border-warning/20">
                 <p className="text-[10px] text-warning leading-relaxed">
                   <strong>Disclaimer:</strong> {response.disclaimer}
                 </p>
               </div>
 
               {/* Close Button */}
               <Button
                 variant="ghost"
                 size="sm"
                 className="w-full text-muted-foreground"
                 onClick={() => {
                   setIsOpen(false);
                   setResponse(null);
                 }}
               >
                 Close explanation
               </Button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </section>
   );
 }
 
 // ===== Prompt Builder =====
 
 function buildEtrMovementPrompt(event: ScenarioWithIntelligence, history: EventStatusSnapshot[]): string {
   const parts: string[] = [];
 
   parts.push("Explain WHY the ETR (Estimated Time of Restoration) changed over time for this event.");
   parts.push("");
   parts.push("## Current Event Status");
   parts.push(`- Event: ${event.name}`);
   parts.push(`- Outage Type: ${event.outage_type || "Unknown"}`);
   parts.push(`- Lifecycle Stage: ${event.lifecycle_stage}`);
 
   if (event.etr_earliest && event.etr_latest) {
     parts.push(`- Current ETR Window: ${format(new Date(event.etr_earliest), "h:mm a")} to ${format(new Date(event.etr_latest), "h:mm a")}`);
   }
   if (event.etr_band_hours !== null) {
     parts.push(`- Current Band Width: ${event.etr_band_hours.toFixed(1)} hours`);
   }
   if (event.etr_confidence) {
     parts.push(`- Current Confidence: ${event.etr_confidence}`);
   }
   if (event.etr_risk_level) {
     parts.push(`- Current Risk Level: ${event.etr_risk_level}`);
   }
 
   parts.push("");
   parts.push("## Critical Load Context");
   parts.push(`- Has Critical Load: ${event.has_critical_load ? "Yes" : "No"}`);
   if (event.has_critical_load) {
     const loadTypes = event.critical_load_types || [];
     if (loadTypes.length > 0) {
       parts.push(`- Critical Facilities: ${loadTypes.join(", ")}`);
     }
     if (event.critical_runway_status) {
       parts.push(`- Runway Status: ${event.critical_runway_status}`);
     }
     if (event.requires_escalation) {
       parts.push(`- Escalation Required: Yes`);
     }
   }
 
   parts.push("");
   parts.push("## ETR Change History");
 
   if (history.length === 0) {
     parts.push("No historical snapshots available. Base analysis on current event data only.");
   } else {
     history.forEach((snapshot, index) => {
       const time = format(new Date(snapshot.recorded_at), "MMM d, h:mm a");
       parts.push(`\n### Snapshot ${index + 1} — ${time}`);
 
       if (snapshot.etr_earliest && snapshot.etr_latest) {
         parts.push(`- ETR Window: ${format(new Date(snapshot.etr_earliest), "h:mm a")} to ${format(new Date(snapshot.etr_latest), "h:mm a")}`);
       }
       if (snapshot.etr_confidence) {
         parts.push(`- Confidence: ${snapshot.etr_confidence}`);
       }
       if (snapshot.etr_risk_level) {
         parts.push(`- Risk Level: ${snapshot.etr_risk_level}`);
       }
       if (snapshot.critical_runway_status) {
         parts.push(`- Runway Status: ${snapshot.critical_runway_status}`);
       }
       if (snapshot.backup_runtime_remaining_hours !== null) {
         parts.push(`- Backup Runtime Remaining: ${snapshot.backup_runtime_remaining_hours.toFixed(1)} hrs`);
       }
 
       const drivers = snapshot.uncertainty_drivers || [];
       if (drivers.length > 0) {
         parts.push(`- Uncertainty Drivers: ${drivers.join(", ")}`);
       }
 
       if (snapshot.change_note) {
         parts.push(`- Change Note: "${snapshot.change_note}"`);
       }
     });
   }
 
   parts.push("");
   parts.push("## Required Output Sections");
   parts.push("A. ETR Change Summary — One paragraph explaining how the ETR evolved over time. Mention widening/narrowing of band and confidence changes.");
   parts.push("B. Key Change Drivers — 3–5 bullets derived from uncertainty_drivers and change_note history. Each bullet tied to a time window (e.g., '18:45–19:30').");
   parts.push("C. Impact on Critical Load Continuity — Explain how ETR changes affected runway risk (if applicable). State if escalation risk increased or decreased.");
   parts.push("D. What this helps operators understand — 2–3 bullets explaining insight, not actions.");
   parts.push("E. Source Notes — List which history fields and timestamps were used. No citation brackets.");
   parts.push("");
   parts.push("## Safety Rules");
   parts.push("- Do not recommend switching or field actions");
   parts.push("- Use advisory language only ('helps explain', 'would be reviewed')");
   parts.push("- If history is incomplete, explain uncertainty clearly");
 
   return parts.join("\n");
 }
 
 // ===== Copy Formatter =====
 
 function formatResponseForCopy(response: CopilotResponse): string {
   const lines: string[] = [];
 
   lines.push(`MODE: ${response.mode_banner}`);
   lines.push("");
 
   if (response.framing_line) {
     lines.push(response.framing_line);
     lines.push("");
   }
 
   response.insights.forEach((insight, index) => {
     lines.push(`${String.fromCharCode(65 + index)}. ${insight.title}`);
     insight.bullets.forEach((bullet) => {
       lines.push(`   • ${bullet}`);
     });
     lines.push("");
   });
 
   if (response.assumptions && response.assumptions.length > 0) {
     lines.push("ASSUMPTIONS");
     response.assumptions.forEach((assumption) => {
       lines.push(`• ${assumption}`);
     });
     lines.push("");
   }
 
   if (response.source_notes && response.source_notes.length > 0) {
     lines.push("SOURCE NOTES");
     response.source_notes.forEach((note) => {
       lines.push(`• ${note}`);
     });
     lines.push("");
   }
 
   lines.push("DISCLAIMER");
   lines.push(response.disclaimer);
 
   return lines.join("\n");
 }