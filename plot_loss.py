#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Q-Former训练Loss可视化脚本
解析训练日志并绘制loss下降曲线
"""

import re
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import numpy as np
from collections import defaultdict
import os

# 设置中文字体支持
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

class LossVisualizer:
    def __init__(self, log_file_path):
        self.log_file_path = log_file_path
        self.batch_losses = []  # 存储每个batch的loss
        self.epoch_losses = []  # 存储每个epoch的平均loss
        self.timestamps = []    # 时间戳
        self.epochs = []        # epoch编号
        self.batches = []       # batch编号
        
    def parse_log_file(self):
        """解析训练日志文件"""
        print(f"📖 正在解析日志文件: {self.log_file_path}")
        
        # 正则表达式模式
        batch_pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - INFO - Epoch (\d+) Batch (\d+): Loss=([0-9.]+)'
        epoch_pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - INFO -\s+平均损失: ([0-9.]+)'
        
        epoch_data = {}
        
        try:
            with open(self.log_file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    # 匹配batch loss
                    batch_match = re.search(batch_pattern, line)
                    if batch_match:
                        timestamp_str, epoch, batch, loss = batch_match.groups()
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        
                        self.timestamps.append(timestamp)
                        self.epochs.append(int(epoch))
                        self.batches.append(int(batch))
                        self.batch_losses.append(float(loss))
                    
                    # 匹配epoch平均loss
                    epoch_match = re.search(epoch_pattern, line)
                    if epoch_match:
                        timestamp_str, avg_loss = epoch_match.groups()
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        
                        # 找到对应的epoch号（从前面的batch数据推断）
                        if self.epochs:
                            current_epoch = self.epochs[-1]  # 最后一个epoch
                            epoch_data[current_epoch] = {
                                'avg_loss': float(avg_loss),
                                'timestamp': timestamp
                            }
                            
        except FileNotFoundError:
            print(f"❌ 错误: 找不到日志文件 {self.log_file_path}")
            return False
        except Exception as e:
            print(f"❌ 解析日志文件时出错: {e}")
            return False
            
        # 整理epoch数据
        for epoch_num in sorted(epoch_data.keys()):
            self.epoch_losses.append(epoch_data[epoch_num]['avg_loss'])
            
        print(f"✅ 解析完成!")
        print(f"   - 总batch数: {len(self.batch_losses)}")
        print(f"   - 总epoch数: {len(self.epoch_losses)}")
        print(f"   - 时间范围: {self.timestamps[0]} ~ {self.timestamps[-1]}")
        
        return True
    
    def plot_loss_curves(self, save_path=None):
        """绘制loss下降曲线"""
        if not self.batch_losses:
            print("❌ 没有找到loss数据，请先解析日志文件")
            return
            
        # 创建图表
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(15, 12))
        
        # 1. 绘制batch-level loss曲线
        ax1.plot(range(len(self.batch_losses)), self.batch_losses, 
                alpha=0.6, linewidth=0.8, color='#1f77b4', label='Batch Loss')
        
        # 添加滑动平均线（窗口大小100）
        if len(self.batch_losses) > 100:
            window_size = 100
            moving_avg = np.convolve(self.batch_losses, 
                                   np.ones(window_size)/window_size, mode='valid')
            ax1.plot(range(window_size-1, len(self.batch_losses)), moving_avg,
                    color='red', linewidth=2, label=f'滑动平均 (窗口={window_size})')
        
        ax1.set_xlabel('Batch 编号')
        ax1.set_ylabel('Loss')
        ax1.set_title('Q-Former训练 - Batch级别Loss曲线', fontsize=16, fontweight='bold')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # 添加统计信息
        initial_loss = self.batch_losses[0]
        final_loss = self.batch_losses[-1]
        min_loss = min(self.batch_losses)
        max_loss = max(self.batch_losses)
        
        stats_text = f'初始Loss: {initial_loss:.4f}\\n最终Loss: {final_loss:.4f}\\n最小Loss: {min_loss:.4f}\\n最大Loss: {max_loss:.4f}'
        ax1.text(0.02, 0.98, stats_text, transform=ax1.transAxes, 
                verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        # 2. 绘制epoch-level平均loss曲线
        if self.epoch_losses:
            epoch_numbers = list(range(1, len(self.epoch_losses) + 1))
            ax2.plot(epoch_numbers, self.epoch_losses, 
                    marker='o', markersize=6, linewidth=2, color='#ff7f0e', label='Epoch平均Loss')
            
            ax2.set_xlabel('Epoch 编号')
            ax2.set_ylabel('平均 Loss')
            ax2.set_title('Q-Former训练 - Epoch级别平均Loss曲线', fontsize=16, fontweight='bold')
            ax2.grid(True, alpha=0.3)
            ax2.legend()
            
            # 添加Epoch统计信息
            if len(self.epoch_losses) > 1:
                epoch_initial = self.epoch_losses[0]
                epoch_final = self.epoch_losses[-1]
                epoch_min = min(self.epoch_losses)
                epoch_improvement = ((epoch_initial - epoch_final) / epoch_initial) * 100
                
                epoch_stats = f'第1轮Loss: {epoch_initial:.4f}\\n最新Loss: {epoch_final:.4f}\\n最佳Loss: {epoch_min:.4f}\\n改善程度: {epoch_improvement:.1f}%'
                ax2.text(0.02, 0.98, epoch_stats, transform=ax2.transAxes,
                        verticalalignment='top', bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        
        plt.tight_layout()
        
        # 保存图表
        if save_path is None:
            # 生成默认保存路径
            log_dir = os.path.dirname(self.log_file_path)
            save_path = os.path.join(log_dir, 'qformer_training_loss_curves.png')
        
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"📊 Loss曲线图已保存至: {save_path}")
        
        # 显示图表
        plt.show()
        
        return save_path
    
    def print_summary(self):
        """打印训练总结"""
        if not self.batch_losses:
            print("❌ 没有数据可以总结")
            return
            
        print("\\n" + "="*60)
        print("📈 Q-Former训练Loss分析总结")
        print("="*60)
        
        # Batch级别统计
        print(f"🔢 Batch级别统计:")
        print(f"   总Batch数: {len(self.batch_losses)}")
        print(f"   初始Loss: {self.batch_losses[0]:.4f}")
        print(f"   最终Loss: {self.batch_losses[-1]:.4f}")
        print(f"   最小Loss: {min(self.batch_losses):.4f}")
        print(f"   最大Loss: {max(self.batch_losses):.4f}")
        print(f"   标准差: {np.std(self.batch_losses):.4f}")
        
        # Epoch级别统计
        if self.epoch_losses:
            print(f"\\n📊 Epoch级别统计:")
            print(f"   总Epoch数: {len(self.epoch_losses)}")
            print(f"   第1轮平均Loss: {self.epoch_losses[0]:.4f}")
            print(f"   最新平均Loss: {self.epoch_losses[-1]:.4f}")
            print(f"   最佳平均Loss: {min(self.epoch_losses):.4f}")
            
            if len(self.epoch_losses) > 1:
                improvement = ((self.epoch_losses[0] - self.epoch_losses[-1]) / self.epoch_losses[0]) * 100
                print(f"   总体改善: {improvement:.2f}%")
        
        # 训练时长
        if len(self.timestamps) > 1:
            duration = self.timestamps[-1] - self.timestamps[0]
            print(f"\\n⏱️  训练时长: {duration}")
            print(f"   开始时间: {self.timestamps[0]}")
            print(f"   结束时间: {self.timestamps[-1]}")
        
        print("="*60)

def main():
    """主函数"""
    # 设置日志文件路径
    log_file = "d:\\Bjtu\\project\\geo-forecast-mis\\qformer_full_training.log"
    
    # 检查文件是否存在
    if not os.path.exists(log_file):
        print(f"❌ 错误: 日志文件不存在 {log_file}")
        return
    
    # 创建可视化器
    visualizer = LossVisualizer(log_file)
    
    # 解析日志文件
    if visualizer.parse_log_file():
        # 打印总结
        visualizer.print_summary()
        
        # 绘制loss曲线
        saved_path = visualizer.plot_loss_curves()
        
        print(f"\\n🎉 分析完成! 图表已保存至: {saved_path}")
    else:
        print("❌ 日志解析失败")

if __name__ == "__main__":
    main()