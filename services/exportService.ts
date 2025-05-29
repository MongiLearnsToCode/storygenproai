
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ShadingType } from 'docx';
import FileSaver from 'file-saver';
import { Project, StoryFramework, Stage } from '../types';
// Removed: import { getAIPerParagraphTitle } from './geminiService'; 

export interface ExportOptions {
  includeOriginalIdea: boolean;
  includeFrameworkTitle: boolean;
  includeStageTitles: boolean;
  // exportStructure: 'segmented' | 'continuous'; // Removed
  // aiGeneratedParagraphTitles: boolean; // Removed
  includeContinuousNarrative: boolean; // Added
}

const generateSafeFilename = (name: string): string => {
  return name.replace(/[^a-z0-9_.\s-]/gi, '_').replace(/\s+/g, '_').toLowerCase();
};

const formatProjectDate = (isoDateString: string): string => {
    return new Date(isoDateString).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
}

export const exportToPdf = async (project: Project, framework: StoryFramework, options: ExportOptions): Promise<void> => {
  try {
    const doc = new jsPDF();
    let yPos = 20; 
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;

    const addTextWithWrapping = (text: string, x: number, y: number, opts: any = {}): number => {
      const lines = doc.splitTextToSize(text, opts.maxWidth || usableWidth);
      doc.text(lines, x, y, opts);
      return y + (lines.length * (opts.fontSize || 12) * 0.352778 * (opts.lineSpacingFactor || 1.2)); 
    };
    
    const checkNewPage = (currentY: number, neededHeight: number = 20): number => {
        if (currentY + neededHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            return margin; 
        }
        return currentY;
    };

    doc.setFont('helvetica');

    // Project Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    yPos = addTextWithWrapping(project.name, pageWidth / 2, yPos, { align: 'center', fontSize: 22 });
    yPos += 5;

    if (options.includeFrameworkTitle) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'normal');
      yPos = addTextWithWrapping(`Framework: ${framework.name}`, margin, yPos, { fontSize: 16 });
      yPos += 3;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    yPos = addTextWithWrapping(`Last Modified: ${formatProjectDate(project.lastmodified)}`, margin, yPos, { fontSize: 10 });
    yPos += 10;

    if (options.includeOriginalIdea && project.rawstoryidea && project.rawstoryidea.trim()) {
      yPos = checkNewPage(yPos, 30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      yPos = addTextWithWrapping('Original Story Idea', margin, yPos, { fontSize: 14 });
      yPos += 2;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      yPos = addTextWithWrapping(project.rawstoryidea, margin, yPos, { fontSize: 12 });
      yPos += 10;
    }
    
    // Always segmented structure first
    for (const stage of framework.stages) {
        yPos = checkNewPage(yPos, options.includeStageTitles ? 40 : 20);

        if (options.includeStageTitles) {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            yPos = addTextWithWrapping(stage.name, margin, yPos, { fontSize: 16 });
            yPos += 2;

            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            yPos = addTextWithWrapping(stage.description, margin, yPos, { fontSize: 10 });
            yPos += 5;
        }

        const stageContent = project.stagescontent[stage.id] || '';
        if (stageContent.trim()) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const contentLines = stageContent.split('\n');
            for (const line of contentLines) {
                yPos = checkNewPage(yPos, 10);
                yPos = addTextWithWrapping(line || " ", margin, yPos, { fontSize: 12 });
            }
        } else if (options.includeStageTitles) { 
            doc.setFontSize(12);
            doc.setFont(undefined, 'italic');
            yPos = checkNewPage(yPos, 10);
            yPos = addTextWithWrapping('[No content for this stage]', margin, yPos, { fontSize: 12 });
        }
        yPos += 10; 
    }

    // Conditionally add Continuous Narrative section
    if (options.includeContinuousNarrative && !options.includeStageTitles) {
        yPos = checkNewPage(yPos, 30);
        doc.addPage(); // Start continuous narrative on a new page for clarity
        yPos = margin;

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        yPos = addTextWithWrapping('Continuous Narrative', pageWidth / 2, yPos, { align: 'center', fontSize: 18 });
        yPos += 8;

        let fullNarrative = framework.stages
            .map(stage => project.stagescontent[stage.id] || '')
            .join('\n\n') // Join with double newline for paragraph separation
            .trim();

        if (fullNarrative) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const contentLines = fullNarrative.split('\n');
            for (const line of contentLines) {
                yPos = checkNewPage(yPos, 10);
                yPos = addTextWithWrapping(line || " ", margin, yPos, { fontSize: 12 });
            }
        } else {
            doc.setFontSize(12);
            doc.setFont(undefined, 'italic');
            yPos = addTextWithWrapping('[No story content available to form a continuous narrative.]', margin, yPos, { fontSize: 12 });
        }
        yPos += 10;
    }


    doc.save(`${generateSafeFilename(project.name)}.pdf`);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
};

export const exportToDocx = async (project: Project, framework: StoryFramework, options: ExportOptions): Promise<void> => {
  try {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        text: project.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    if (options.includeFrameworkTitle) {
      children.push(
        new Paragraph({
          children: [new TextRun(`Framework: ${framework.name}`)],
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 },
        })
      );
    }
    
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Last Modified: ${formatProjectDate(project.lastmodified)}`, size: 18, italics: true })],
        spacing: { after: 300 },
      })
    );

    if (options.includeOriginalIdea && project.rawstoryidea && project.rawstoryidea.trim()) {
      children.push(
        new Paragraph({
          text: 'Original Story Idea',
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 100, before: 200 },
        })
      );
      project.rawstoryidea.split('\n').forEach(line => {
        children.push(new Paragraph({ text: line || " ", spacing: { after: 50 }, style: "normalPara" }));
      });
       children.push(new Paragraph({ spacing: { after: 200 } }));
    }

    // Always segmented structure first
    for (const stage of framework.stages) {
        if (options.includeStageTitles) {
            children.push(
            new Paragraph({
                text: stage.name,
                heading: HeadingLevel.HEADING_3, 
                spacing: { after: 80, before: 300 }, 
            })
            );
            children.push(
            new Paragraph({
                children: [new TextRun({ text: stage.description, italics: true, size: 20 })],
                spacing: { after: 150 },
                style: "normalParaSmall" 
            })
            );
        }

        const stageContent = project.stagescontent[stage.id] || '';
        if (stageContent.trim()) {
        stageContent.split('\n').forEach(line => {
            children.push(new Paragraph({ text: line || " ", spacing: { after: 80 }, style: "normalPara"}));
        });
        } else if (options.includeStageTitles) { 
        children.push(
            new Paragraph({
            children: [new TextRun({ text: '[No content for this stage]', italics: true, color: "808080" })],
            spacing: { after: 150 },
            style: "normalPara"
            })
        );
        }
        // Add a bit more space after each stage's content in segmented view
        // but not a full page break unless it's the last item before a potential continuous narrative.
        if (!(options.includeContinuousNarrative && !options.includeStageTitles && framework.stages.indexOf(stage) === framework.stages.length - 1) ) {
            children.push(new Paragraph({ spacing: { after: 200 } })); 
        }
    }

    // Conditionally add Continuous Narrative section
    if (options.includeContinuousNarrative && !options.includeStageTitles) {
        children.push(new Paragraph({ pageBreakBefore: true })); // Start on a new page
        children.push(
            new Paragraph({
            text: "Continuous Narrative",
            heading: HeadingLevel.HEADING_1, // Make it prominent
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, before: 200 },
            })
        );

        let fullNarrative = framework.stages
            .map(stage => project.stagescontent[stage.id] || '')
            .join('\n\n') // Join with double newline
            .trim();
        
        if (fullNarrative) {
            fullNarrative.split('\n').forEach(line => {
                 children.push(new Paragraph({ text: line || " ", spacing: { after: 80 }, style: "normalPara" }));
            });
        } else {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: '[No story content available to form a continuous narrative.]', italics: true, color: "808080" })],
                    spacing: { after: 150 },
                    style: "normalPara"
                })
            );
        }
    }


    const doc = new Document({
      sections: [{
        properties: {
            page: {
                margin: {
                    top: 1440, right: 1440, bottom: 1440, left: 1440, 
                },
            },
        },
        children: children,
      }],
      styles: {
        paragraphStyles: [
            {
                id: "normalPara",
                name: "Normal Text Paragraph",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: { font: "Helvetica", size: 24 }, 
                paragraph: { spacing: { line: 276, after: 120 } }, 
            },
            {
                id: "normalParaSmall",
                name: "Normal Small Text",
                basedOn: "Normal",
                next: "Normal",
                run: { font: "Helvetica", size: 20 }, 
                paragraph: { spacing: { line: 240, after: 100 } }, 
            },
            // Removed paragraphTitleStyle as AI per-paragraph titles are removed
        ],
        default: { 
            document: {
                run: { font: "Helvetica", size: 24 }, 
                paragraph: { spacing: { line: 276, after: 120 } },
            },
            heading1: { 
                run: { size: 44, bold: true, font: "Helvetica" }, 
                paragraph: { spacing: { after: 240 } },
            },
            heading2: { 
                run: { size: 32, bold: false, font: "Helvetica" }, 
                paragraph: { spacing: { after: 180 } },
            },
            heading3: { 
                run: { size: 28, bold: true, font: "Helvetica" }, 
                paragraph: { spacing: { after: 120, before: 240 } },
            },
        }
      }
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `${generateSafeFilename(project.name)}.docx`);
  } catch (error) {
    console.error("Error exporting to DOCX:", error);
    throw error;
  }
};
