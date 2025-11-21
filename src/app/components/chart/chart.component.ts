import { Component, ElementRef, ViewChild, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { CalculationService } from '../../services/calculation.service';

@Component({
    selector: 'app-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chart.component.html',
    styleUrl: './chart.component.css'
})
export class ChartComponent implements OnInit, OnDestroy {
    @ViewChild('chartContainer', { static: true }) private chartContainer!: ElementRef;

    private calcService = inject(CalculationService);
    private history = this.calcService.history;
    private resizeObserver!: ResizeObserver;

    constructor() {
        // Re-render chart when history changes
        effect(() => {
            const data = this.history();
            if (data.length > 0) {
                this.drawChart(data);
            }
        });
    }

    ngOnInit() {
        this.resizeObserver = new ResizeObserver(() => {
            this.drawChart(this.history());
        });
        this.resizeObserver.observe(this.chartContainer.nativeElement);
    }

    ngOnDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    private drawChart(data: { timestamp: Date; price: number; isForecast: boolean }[]) {
        const element = this.chartContainer.nativeElement;
        d3.select(element).selectAll('*').remove();

        if (!data.length) return;

        const margin = { top: 20, right: 20, bottom: 30, left: 50 };
        const width = element.clientWidth - margin.left - margin.right;
        const height = element.clientHeight - margin.top - margin.bottom;

        const svg = d3.select(element)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.timestamp) as [Date, Date])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(data, d => d.price)! * 0.95,
                d3.max(data, d => d.price)! * 1.05
            ])
            .range([height, 0]);

        // Split data into segments to handle transitions correctly
        // We'll draw one path for historical and one for forecast
        // The forecast path should start where historical ends to be continuous

        const historicalData = data.filter(d => !d.isForecast);
        const forecastData = data.filter(d => d.isForecast);

        // Add the last historical point to forecast data to ensure continuity
        if (historicalData.length > 0 && forecastData.length > 0) {
            forecastData.unshift(historicalData[historicalData.length - 1]);
        }

        const line = d3.line<{ timestamp: Date; price: number }>()
            .x(d => x(d.timestamp))
            .y(d => y(d.price))
            .curve(d3.curveMonotoneX);

        // Add X Axis with day format
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .ticks(10)
                .tickFormat((d) => {
                    const date = d as Date;
                    return date.getDate().toString();
                }));

        // Add Y Axis
        svg.append('g')
            .call(d3.axisLeft(y));

        // Draw Historical Line (Solid)
        if (historicalData.length > 0) {
            svg.append('path')
                .datum(historicalData)
                .attr('fill', 'none')
                .attr('stroke', '#2563eb') // Blue
                .attr('stroke-width', 3)
                .attr('d', line);
        }

        // Draw Forecast Line (Dotted)
        if (forecastData.length > 0) {
            svg.append('path')
                .datum(forecastData)
                .attr('fill', 'none')
                .attr('stroke', '#9333ea') // Purple
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '5,5') // Dotted effect
                .attr('d', line);
        }

        // Add Dots
        const dots = svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.timestamp))
            .attr('cy', d => y(d.price))
            .attr('r', 4)
            .attr('fill', d => d.isForecast ? '#fff' : '#2563eb')
            .attr('stroke', d => d.isForecast ? '#9333ea' : '#2563eb')
            .attr('stroke-width', 2);

        // Tooltip
        const tooltip = d3.select(element)
            .append('div')
            .style('position', 'fixed')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', '#fff')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '10');

        // Add invisible overlay for hover detection
        dots.on('mouseover', (event, d) => {
            tooltip.style('visibility', 'visible')
                .html(`
                    <strong>${d.timestamp.toLocaleDateString()}</strong><br/>
                    Price: ${d.price.toFixed(2)} MAD<br/>
                    ${d.isForecast ? '(Forecast)' : '(Historical)'}
                `);

            d3.select(event.currentTarget)
                .attr('r', 6);
        })
            .on('mousemove', (event) => {
                const tooltipNode = tooltip.node() as HTMLElement;
                const tooltipWidth = tooltipNode?.offsetWidth || 0;
                const tooltipHeight = tooltipNode?.offsetHeight || 0;
                const containerRect = element.getBoundingClientRect();

                let left = event.pageX + 10;
                let top = event.pageY - 10;

                // Keep tooltip within viewport
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - 10;
                }
                if (top + tooltipHeight > window.innerHeight) {
                    top = event.pageY - tooltipHeight - 10;
                }

                tooltip
                    .style('left', left + 'px')
                    .style('top', top + 'px');
            })
            .on('mouseout', (event) => {
                tooltip.style('visibility', 'hidden');
                d3.select(event.currentTarget)
                    .attr('r', 4);
            });
    }
}
