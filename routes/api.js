'use strict';

const { ObjectId } = require('mongodb');
let issues = {};

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      let projectIssues = issues[project] || [];
      let filteredIssues = projectIssues;

      Object.keys(req.query).forEach(key => {
        if (req.query[key] !== '') {
          filteredIssues = filteredIssues.filter(issue => {
            if (key === 'open'){
              return issue.open === (req.query[key] === 'true');
            }
            return issue[key] && issue[key].toString().includes(req.query[key]);
          });
        }
      });
      
      res.json(filteredIssues);
    })
    
    .post(function (req, res){
      let project = req.params.project;
      let { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // Check required fields
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }
      
      // Initialize project issues array if it doesn't exist
      if (!issues[project]) {
        issues[project] = [];
      }
      
      // Create new issue
      const newIssue = {
        _id: new ObjectId().toString(),
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
        open: true
      };
      
      issues[project].push(newIssue);
      res.json(newIssue);
      
    })
    
    .put(function (req, res){
      let project = req.params.project;
      let { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
      
      // Check if _id is provided
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

        // Check if there are fields to update (excluding _id and empty strings)
        const possibleFields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
        const fieldsToUpdate = possibleFields.filter(field => {
          const value = req.body[field];
          return value !== undefined && value !== '';
        });
        
        if (fieldsToUpdate.length === 0) {
          return res.json({ error: 'no update field(s) sent', _id: _id });
        }
        
        // Find and update the issue
        let projectIssues = issues[project] || [];
        let issueIndex = projectIssues.findIndex(issue => issue._id === _id);
        
        if (issueIndex === -1) {
          return res.json({ error: 'could not update', _id: _id });
        }
        
        // Update the issue
        fieldsToUpdate.forEach(field => {
          if (field === 'open') {
            // Handle boolean conversion for open field
            if (req.body.open === 'false' || req.body.open === false) {
              issues[project][issueIndex].open = false;
            } else if (req.body.open === 'true' || req.body.open === true) {
              issues[project][issueIndex].open = true;
            }
          } else {
            issues[project][issueIndex][field] = req.body[field];
          }
        });
        
        issues[project][issueIndex].updated_on = new Date().toISOString();
        
        res.json({ result: 'successfully updated', _id: _id });
      
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      let { _id } = req.body;
      
      // Check if _id is provided
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      
      // Find and delete the issue
      let projectIssues = issues[project] || [];
      let issueIndex = projectIssues.findIndex(issue => issue._id === _id);
      
      if (issueIndex === -1) {
        return res.json({ error: 'could not delete', _id: _id });
      }
      
      // Remove the issue
      issues[project].splice(issueIndex, 1);
      
      res.json({ result: 'successfully deleted', _id: _id });
      
    });
    
};
