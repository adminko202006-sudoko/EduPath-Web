import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import 'scholarship_model.dart';
import 'scholarship_provider.dart';

class ScholarshipScreen extends StatelessWidget {
  const ScholarshipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ScholarshipProvider()..loadData(),
      child: const _ScholarshipView(),
    );
  }
}

class _ScholarshipView extends StatelessWidget {
  const _ScholarshipView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scholarships'),
      ),
      body: Consumer<ScholarshipProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading &&
              provider.scholarships.isEmpty &&
              provider.applications.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (provider.errorMessage != null &&
              provider.scholarships.isEmpty) {
            return _ErrorState(
              message: provider.errorMessage!,
              onRetry: provider.loadData,
            );
          }

          return RefreshIndicator(
            onRefresh: provider.loadData,
            child: provider.scholarships.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 150),
                      _EmptyState(),
                    ],
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    children: [
                      _HeaderCard(
                        applicationCount: provider.applications.length,
                      ),
                      const SizedBox(height: 20),
                      ...provider.scholarships.map(
                        (scholarship) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _ScholarshipCard(
                            scholarship: scholarship,
                            application:
                                provider.applicationFor(scholarship.id),
                          ),
                        ),
                      ),
                    ],
                  ),
          );
        },
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.applicationCount,
  });

  final int applicationCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.workspace_premium_outlined,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Scholarship Opportunities',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '$applicationCount application${applicationCount == 1 ? '' : 's'} submitted',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ScholarshipCard extends StatelessWidget {
  const _ScholarshipCard({
    required this.scholarship,
    required this.application,
  });

  final ScholarshipModel scholarship;
  final ScholarshipApplicationModel? application;

  @override
  Widget build(BuildContext context) {
    final hasApplied = application != null;

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: Colors.grey.shade200,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    scholarship.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textColor,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (hasApplied)
                  _StatusBadge(
                    status: application!.status,
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              scholarship.description,
              style: TextStyle(
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            _InfoRow(
              icon: Icons.payments_outlined,
              label: 'Amount',
              value: '₱${scholarship.amount.toStringAsFixed(2)}',
            ),
            if (scholarship.applicationEnd != null) ...[
              const SizedBox(height: 10),
              _InfoRow(
                icon: Icons.event_outlined,
                label: 'Application deadline',
                value: _formatDate(scholarship.applicationEnd!),
              ),
            ],
            const SizedBox(height: 14),
            const Text(
              'Eligibility',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppTheme.textColor,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              scholarship.eligibility.isEmpty
                  ? 'No eligibility information provided.'
                  : scholarship.eligibility,
              style: TextStyle(
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Requirements',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppTheme.textColor,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              scholarship.requirements.isEmpty
                  ? 'No requirements information provided.'
                  : scholarship.requirements,
              style: TextStyle(
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 18),
            if (!hasApplied)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    _showApplyDialog(context, scholarship);
                  },
                  icon: const Icon(Icons.send_outlined),
                  label: const Text('Apply for Scholarship'),
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.check_circle_outline),
                  label: Text(
                    'Application ${_capitalize(application!.status)}',
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showApplyDialog(
    BuildContext context,
    ScholarshipModel scholarship,
  ) {
    final remarksController = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text('Apply for ${scholarship.name}'),
          content: TextField(
            controller: remarksController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Remarks',
              hintText: 'Optional remarks',
              alignLabelWithHint: true,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                remarksController.dispose();
                Navigator.of(dialogContext).pop();
              },
              child: const Text('Cancel'),
            ),
            Consumer<ScholarshipProvider>(
              builder: (context, provider, _) {
                return ElevatedButton(
                  onPressed: provider.isApplying
                      ? null
                      : () async {
                          final success = await provider.apply(
                            scholarshipId: scholarship.id,
                            remarks: remarksController.text,
                          );

                          if (!dialogContext.mounted) {
                            return;
                          }

                          if (success) {
                            remarksController.dispose();
                            Navigator.of(dialogContext).pop();

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Scholarship application submitted successfully.',
                                ),
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  provider.errorMessage ??
                                      'Unable to submit application.',
                                ),
                              ),
                            );
                          }
                        },
                  child: provider.isApplying
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Submit'),
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({
    required this.status,
  });

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _capitalize(status),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 20,
          color: AppTheme.primaryColor,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: TextStyle(
                color: Colors.grey.shade700,
              ),
              children: [
                TextSpan(
                  text: '$label: ',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextSpan(
                  text: value,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(
              Icons.workspace_premium_outlined,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            const Text(
              'No scholarships available',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.bold,
                color: AppTheme.textColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'There are currently no active scholarship opportunities.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 60,
              color: Colors.red.shade400,
            ),
            const SizedBox(height: 16),
            const Text(
              'Unable to load scholarships',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatDate(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}

String _capitalize(String value) {
  if (value.isEmpty) {
    return value;
  }

  return value[0].toUpperCase() + value.substring(1).toLowerCase();
}

Color _statusColor(String status) {
  switch (status.toLowerCase()) {
    case 'approved':
      return Colors.green;
    case 'rejected':
      return Colors.red;
    case 'pending':
    default:
      return Colors.orange;
  }
}
