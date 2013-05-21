/**
 * Sets environment variable, whether or not
 * this is a DEV environment 
 * @type {Boolean}
 */
var DEV = false;

$(document).ready(function() { 
  var $document = $(document),
      $window = $(window),
      $body = $('body');


  // Define the View
  Driftwood = Backbone.View.extend( {
    /**
     * Container of all our visibile
     * @type object
     */
    el: $('.main'),

    initialize: function() {        

      _.bindAll(this, 'render');
      
      this.ContextMenu = new ContextMenu();
      this.Chat = new Chat();
      this.CanvasManager = new CanvasManager();
      this.Commands = new Commands({CanvasManager:this.CanvasManager});

      this.addEventListeners();
      
    },

    addEventListeners: function() {
      //Tabs
      $body.on('click','[data-toggle="tab"]', function() {
        var $this = $(this);
        $body.find($this.closest('[data-tab-panels]').data('tab-panels')).hide();
        $body.find($(this).data('target')).css('display','table-row');
      } );

      //Elastic input
      var scope = this;
      
      //Makes textareas elastic
      $body.find('[data-activate="elastic"]').each( function() {
        scope.dataActivate([this]);
      } );
      //Runs activation toggles
      $body.on('click focus blur','[data-activate]:not([data-on="load"])', function(e) {
        var on = $(this).data('on');
        if( ! on || on.split(',').indexOf(e.type) !== -1 ) {
          scope.dataActivate(this);
        }
      } );
      //Clears a target of its value
      $body.on('click','[data-clear]', function() {
        var $target = $body.find($(this).data('clear'));
        $target.val('');
      })

      //Creates a context menu
      $body.on('contextmenu','.canvas-wrapper', function(e) {
        scope.ContextMenu.open( {
          x:e.clientX,
          y:e.clientY,
          e: e
        } );
        e.preventDefault();
      } );
      //Creates a color picker
      $editorPicker = $body.find('.editor-color')
      $editorPicker.ColorPicker({
        onSubmit: function(hsb, hex, rgb, el) {
          $editorPicker.val('#' + hex);
          $body.find('.editor').css('background-color', '#' + hex);
        },
        onBeforeShow: function () {
          $(this).ColorPickerSetColor(this.value);
        },
        onChange: function (hsb, hex, rgb) {
          $editorPicker.val('#' + hex);
          $editorPicker.trigger('change');
          $body.find('.editor').css('background-color', '#' + hex);
        }
      });

    },

    dataActivate: function( object ) {
      var $object = $(object),
          activate = $object.data('activate'),
          target = $object.data('target'),
          $target = $body.find(target),
          $value = $object.attr('value') ? $object.attr('value') : $object.html();

      switch( activate ) {
        case 'elastic':
          this.elasticize(object);
          break;
        case 'focus':
          $target.toggleClass('focus');
          break;
        case 'replace':
          $target.html($value);
          break;
      }
    },

    //Makes a textarea elastic
    elasticize: function(a) {
      var b="overflow"+("overflowY" in document.getElementsByTagName("script")[0].style?"Y":""),e=function(h,g,j){if(g.addEventListener){for(var f=0;f<h.length;f++){g.addEventListener(h[f],j,0)}}else{if(g.attachEvent){for(var f=0;f<h.length;f++){g.attachEvent("on"+h[f],j)}}}};for(var c=0;c<a.length;c++){a[c].style[b]="hidden";a[c].__originalRows=a[c].rows;var d=function(f){var h=f.target||f.srcElement||this,g=h.scrollTop;h.scrollTop=1;while(h.scrollTop>0){var j=h.clientHeight,i=true;h.rows++;if(h.clientHeight==j){if(h.style[b]){h.style[b]=""}h.scrollTop=g;return}h.scrollTop=1}if(!i){while(h.scrollTop==0&&h.rows>h.__originalRows){h.rows--;h.scrollTop=1}if(h.scrollTop>0){h.rows++}}if(!h.style[b]){h.style[b]="hidden"}};e(["keyup","paste"],a[c],d);d({target:a[c]})}
    },
 
  } );

  /**
   * Context Menu View
   *
   * Allows us to open our own context menu where ever we want. When 
   * a context menu is opened, an X and Y position must be passed.
   *
   * In order to filter out what menu options are available, 
   */
  ContextMenu = Backbone.View.extend( {
    // Container element
    el: $('body'),
    //Grab the template from the page
    template: _.template($('#contextMenuTemplate').html()),

    initialize: function() {
      _.bindAll(this,'render');
      //Add event listeners
      this.addEventListeners();
    },
    addEventListeners: function() {
      //Makes sure the context menu gets closed
      $body.on('click', _.bind(this.close,this));
    },
    open: function(options) {
      //Set all our options
      this.options = options;
      this.object = options.object || false;
      this.X = options.x;
      this.Y = options.y;

      //Build the menu, close other menus, render a new one
      this.buildContextMenu();
      this.close();
      this.render();
    },
    buildContextMenu: function() {
      //TODO: Determine what options should be turned on or off
    },
    render: function() {
      $(this.el).append(this.template({}));
      $body.find('.context-menu').css( {
        top: this.Y,
        left: this.X
      } );
    },
    close: function() {
      $body.find('.context-menu').remove();
    }
  } );

  /**
   * Chat
   *
   * Allows us to send, receive, and render chat
   * messages. 
   */
  Chat = Backbone.View.extend( {
    // Container element
    el: $('.panel .chat'),
    //Grab the template from the page
    template: _.template($('#chatMessageTemplate').html()),

    initialize: function() {
      _.bindAll(this,'render');
      //Add event listeners
      this.addEventListeners();
      this.scrollChat(0);
    },
    addEventListeners: function() {
      //Chat enter
      $(this.el).on('keypress','.input textarea', _.bind( function(e) {
        //Enter key, but not shift enter
        if( e.keyCode === 13 && ! e.shiftKey ){
          this.sendMessage(e.target);
          return false;
        }
      }, this ) );
    },

    sendMessage: function(input) {
      var $input = $(input),
          message = $input.val();

      $input.val('')
      //TODO: Send message off to server
      if( message.replace(/\s+/g, ' ') !== '' ) {
        console.log(message);
        this.message = message;
        this.render();

        //Remove the active class after rendered
        $(this.el).find('.messages .active').removeClass('active');
      }
        
    },

    render: function() {
      var $messages = $(this.el).find('.messages'),
          scrollTop = $messages[0].scrollTop,
          scrollHeight = $messages[0].scrollHeight,
          height = $messages.outerHeight();

      $messages.append(this.template({message: this.message}));

      //Were they at the bottom when we added the message?
      //If so, scroll. If not, don't ruin their scroll position
      if( (scrollHeight - scrollTop) == height  ) {
        this.scrollChat(100);
      }
    },

    //Scrolls the chat window
    scrollChat: function( scrollTime ) {
      var scrollTime = (typeof scrollTime === 'undefined') ? 500 : scrollTime,
          $messages = $body.find('.messages'),
          scrollHeight = $messages[0].scrollHeight;
    
      $messages.scrollTo(scrollHeight,scrollTime);
    },
  } );

  /**
   * Command
   *
   * Executes commands, toggles menu items 
   */
  Commands = Backbone.View.extend( {
    // Container element
    el: $('.editor .commands'),

    subMenuDelay: 800,

    initialize: function(options) {
      _.bindAll(this,'render');

      //Set options
      this.options = options;
      this.CanvasManager = options.CanvasManager || new CanvasManager();
      //Add event listeners
      this.addEventListeners();
      //Execute intiial loading command
      this.runInitialCommand();
    },
    addEventListeners: function() {
      var scope = this;
      //Switches the active icon when a dropdown option is selected
      $body.on('click','.commands .dropdown-menu li', function() {
        var $this = $(this),
            icon = $this.find('b')[0].className,
            command = $this.closest('[data-cmd]').data('cmd'),
            $parentIcon = $this.closest('.btn-group').find('.dropdown-toggle b');

        $parentIcon[0].className = icon;
        $parentIcon.closest('[data-cmd]').attr('data-cmd',command);
        $body.find('.commands .btn.active').removeClass('active');
        $parentIcon.parent().addClass('active');
      } );

      //Stop the standard dropdown from happening, we only want the dropdown
      //to open on longpress (but we do want the actual button to be toggled)
      $body.on('click','.commands .dropdown-toggle', function() {
        $(this).button('toggle');
        return false;
      } );
      //Hook into mousedown to fire off our long press test. Sets a timer to
      //show the dropdown menu in X seconds
      $body.on('mousedown','.commands .dropdown-toggle', function(e) {
        var $this = $(this);
        $this.button('toggle');
        scope.commandTimer = window.setTimeout(function () {
          $this.dropdown('toggle');
        }, scope.subMenuDelay );
        e.preventDefault();
      } );
      //Clears the longpress timer and toggles dropdown - if it's open it will stay open
      //and if it's not open it won't open. The bootstrap event toggle happens after this
      //function bubbles, so we toggle it once to the set the opposisite of what we want
      $body.on('mouseup','.commands .dropdown-toggle', function(e) {
        //Clear our longpress timeout 
        clearTimeout(scope.commandTimer);

        var $this = $(this);
        //Makes sure our menu opens/closes properly
        $this.dropdown('toggle');
        //Because of the timing of open, close we actually want to execute the command
        //if the btn-group is reporting it's open (because once this function finishes
        //and bubbles up, the bootstrap event listener will toggle it the other way)
        if( $(this).closest('.btn-group').hasClass('open') && $(this).data('cmd') ) {
          scope.doCommand($(this).data('cmd'));
        }
      } );
      //Simple do command event listener
      $body.on('click','[data-cmd]', function(e) {
        scope.doCommand($(this).data('cmd'));
      } );
    },
    //Checks the DOM to see what command is set as active and runs it
    runInitialCommand: function() {
      var command = $body.find('.commands [data-cmd].active').data('cmd');
      this.doCommand(command);
    },
    //Checks our command switch and fires off the command to whatever 
    //controller neds it
    doCommand: function(command) {
      switch(command) {
        case 'moveCanvas' :
          this.CanvasManager.trigger('moveCanvas');
          break;
        case 'selectCanvas' :
          this.CanvasManager.trigger('selectCanvas');
          break;
      }
    },
  } );

  /**
   * CanvasManager
   *
   * Handles major canvas interactions, such as dragging/panning,
   * etc
   */
  CanvasManager = Backbone.View.extend( {
    canvasMove: false,

    initialize: function() {
      _.bindAll(this,'render');
      
      //Add event listeners
      this.addEventListeners();
      this.on_resize();
      
      this.canvas = new fabric.Canvas('c');

      //Just some preset stuff for testing
      this.canvas.setWidth( 3000 );
      this.canvas.setHeight( 3000 );
      this.canvas.setOverlayImage('assets/images/grid.svg', this.canvas.renderAll.bind(this.canvas))
      var circle = new fabric.Circle({
        radius: 20, fill: 'green', left: 200, top: 300
      });
      this.canvas.add(circle);
    },

    addEventListeners: function() {
      this.on('moveCanvas', _.bind(this.activateCanvasMove,this));
      this.on('selectCanvas',_.bind(this.activateCanvasSelect,this));
      $window.on('resize',this.on_resize);
    },

    on_resize: function() {
      //Make sure the canvas wrapper stays the width of the screen, minus our side panel
      $body.find('.canvas-wrapper').width($window.width()-$('.panel').outerWidth()).height($window.height());
    },

    //Disables all our different canvas interactions
    disableAll: function() {
      this.disableCanvasMove();
    },

    //TODO: fill me
    activateCanvasSelect: function() {
      this.disableAll();
    },
    //Says we can move a canvas, declares event listeners
    activateCanvasMove: function() {
      this.disableAll();
      $body.find('.editor .overlay').show();
      $body.on('mousedown.canvasPan','.canvas-wrapper', _.bind( this.startCanvasMove, this ) );
      $body.on('mouseup.canvasPan', _.bind( this.stopCanvasMove, this ) );
      $body.on('mousemove.canvasPan','.canvas-wrapper', _.bind( this.moveCanvas, this ) );
    },
    //Removes event listeners for the canvas move
    disableCanvasMove: function() {
      $body.off('.canvasPan');
      $body.find('.editor .overlay').hide();
    },
    
    startCanvasMove: function(e) {
      this.canvasMove = true;
      this.X = e.clientX;
      this.Y = e.clientY;
      this.scrollLeft = $body.find('.canvas-wrapper')[0].scrollLeft;
      this.scrollTop = $body.find('.canvas-wrapper')[0].scrollTop;
    },

    stopCanvasMove: function() {
      $body.find('.overlay').css({
        top: 0,
        left: 0
      } );
      this.canvasMove = false;
    },
    moveCanvas: function(e) {
      if( this.canvasMove ) {
        var moveY = e.clientY - this.Y,
            moveX = e.clientX - this.X;

        $body.find('.editor .overlay').css({
          top: moveY,
          left: moveX
        } );
        if( this.scrollLeft - moveX > 0 ) {
          $body.find('.canvas-wrapper').scrollLeft( this.scrollLeft + (- moveX) );
        }
        if( this.scrollTop - moveY > 0 ) {
          $body.find('.canvas-wrapper').scrollTop( this.scrollTop + (- moveY) ) ;
        }
      }
      e.preventDefault();
    }

  } );

  var app = new Driftwood();
});