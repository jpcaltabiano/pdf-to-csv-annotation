import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from "pdfjs-dist";

// worker setup (required) - using local worker file to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

const PDFDisplay = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    // load PDF document
    useEffect(() => {
        const loadPDF = async () => {
            try {
                const loadingTask = pdfjsLib.getDocument("/test.pdf");
                const pdfDoc = await loadingTask.promise;
                setPdf(pdfDoc);
                setTotalPages(pdfDoc.numPages);
            } catch (error) {
                console.error("Error loading PDF:", error);
            }
        };

        loadPDF();
    }, []);

    // render page when PDF or page number changes
    useEffect(() => {
        const renderPage = async () => {
            if (!pdf || !canvasRef.current) return;

            setLoading(true);
            try {
                // get current page
                const page = await pdf.getPage(currentPage);
                const viewport = page.getViewport({ scale: 1.5 });
                
                // set canvas dimensions
                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // clear canvas before rendering
                context.clearRect(0, 0, canvas.width, canvas.height);

                // render the page
                const renderContext = { 
                    canvasContext: context, 
                    viewport: viewport,
                    canvas: canvas
                };
                await page.render(renderContext).promise;
            } catch (error) {
                console.error("Error rendering page:", error);
            } finally {
                setLoading(false);
            }
        };

        renderPage();
    }, [pdf, currentPage]);

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '1rem',
                marginBottom: '1rem',
                padding: '0.5rem'
            }}>
                <button 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1 || loading}
                    style={{
                        padding: '0.5rem 1rem',
                        cursor: currentPage === 1 || loading ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 || loading ? 0.5 : 1
                    }}
                >
                    Previous
                </button>
                <span style={{ minWidth: '100px', textAlign: 'center' }}>
                    Page {currentPage} of {totalPages}
                </span>
                <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages || loading}
                    style={{
                        padding: '0.5rem 1rem',
                        cursor: currentPage === totalPages || loading ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages || loading ? 0.5 : 1
                    }}
                >
                    Next
                </button>
            </div>
            {loading && (
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    Loading...
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
};

export default PDFDisplay;